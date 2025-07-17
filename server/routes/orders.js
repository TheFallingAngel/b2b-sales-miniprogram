const express = require('express');
const Joi = require('joi');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Store = require('../models/Store');
const { authenticateToken } = require('./auth');

const router = express.Router();

const orderItemSchema = Joi.object({
  product: Joi.string().required(),
  quantity: Joi.number().min(1).required(),
  unitPrice: Joi.number().min(0).required(),
  discount: Joi.number().min(0).default(0)
});

const orderSchema = Joi.object({
  orderType: Joi.string().valid('代客下单', '门店自主下单', '补货订单').required(),
  store: Joi.string().required(),
  items: Joi.array().items(orderItemSchema).min(1).required(),
  paymentMethod: Joi.string().valid('现金', '银行转账', '支付宝', '微信支付', '赊账').required(),
  deliveryMethod: Joi.string().valid('送货上门', '门店自提', '第三方物流').required(),
  plannedDeliveryDate: Joi.date().optional(),
  deliveryAddress: Joi.string().optional(),
  notes: Joi.string().optional(),
  creditDays: Joi.number().min(0).default(0)
});

router.get('/', authenticateToken, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status, 
      orderType,
      storeId,
      startDate,
      endDate 
    } = req.query;

    const query = { salesRep: req.user.userId };
    
    if (status) query.orderStatus = status;
    if (orderType) query.orderType = orderType;
    if (storeId) query.store = storeId;
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const orders = await Order.find(query)
      .populate('store', 'storeName storeCode owner address')
      .populate('salesRep', 'realName phone')
      .populate('items.product', 'productCode productName brand')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Order.countDocuments(query);

    // 获取订单统计数据
    const stats = await Order.aggregate([
      { $match: { salesRep: req.user.userId } },
      {
        $group: {
          _id: '$orderStatus',
          count: { $sum: 1 },
          totalAmount: { $sum: '$orderSummary.totalAmount' }
        }
      }
    ]);

    const orderStats = {
      total: 0,
      pending: 0,
      confirmed: 0,
      shipped: 0,
      totalAmount: 0
    };

    stats.forEach(stat => {
      orderStats.total += stat.count;
      orderStats.totalAmount += stat.totalAmount;
      
      switch(stat._id) {
        case '待确认':
          orderStats.pending = stat.count;
          break;
        case '已确认':
          orderStats.confirmed = stat.count;
          break;
        case '已发货':
          orderStats.shipped = stat.count;
          break;
      }
    });

    res.json({
      success: true,
      data: {
        orders,
        total,
        stats: orderStats,
        pagination: {
          current: parseInt(page),
          pageSize: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('获取订单列表错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '获取订单列表失败' 
    });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { error } = orderSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        success: false, 
        message: '订单数据格式错误',
        details: error.details[0].message
      });
    }

    const store = await Store.findOne({
      _id: req.body.store,
      salesRep: req.user.userId
    });

    if (!store) {
      return res.status(404).json({ 
        success: false, 
        message: '门店不存在或无权限下单' 
      });
    }

    const productIds = req.body.items.map(item => item.product);
    const products = await Product.find({ 
      _id: { $in: productIds },
      isActive: true 
    });

    if (products.length !== productIds.length) {
      return res.status(400).json({ 
        success: false, 
        message: '部分产品不存在或已下架' 
      });
    }

    let subtotal = 0;
    let totalDiscount = 0;
    const processedItems = [];

    for (const item of req.body.items) {
      const product = products.find(p => p._id.toString() === item.product);
      
      if (product.inventory.availableStock < item.quantity) {
        return res.status(400).json({ 
          success: false, 
          message: `产品 ${product.productName} 库存不足，可用库存：${product.inventory.availableStock}` 
        });
      }

      if (item.quantity < product.pricing.minOrderQty) {
        return res.status(400).json({ 
          success: false, 
          message: `产品 ${product.productName} 最小起订量：${product.pricing.minOrderQty}` 
        });
      }

      const totalPrice = item.quantity * item.unitPrice;
      const discountAmount = totalPrice * (item.discount / 100);
      const finalPrice = totalPrice - discountAmount;

      processedItems.push({
        product: item.product,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice,
        discount: item.discount,
        finalPrice
      });

      subtotal += totalPrice;
      totalDiscount += discountAmount;

      product.inventory.availableStock -= item.quantity;
      product.inventory.reservedStock += item.quantity;
      await product.save();
    }

    const totalAmount = subtotal - totalDiscount;

    const orderData = {
      ...req.body,
      items: processedItems,
      salesRep: req.user.userId,
      orderSummary: {
        subtotal,
        totalDiscount,
        deliveryFee: 0,
        totalAmount
      },
      paymentInfo: {
        paymentMethod: req.body.paymentMethod,
        creditDays: req.body.creditDays || 0
      },
      deliveryInfo: {
        deliveryMethod: req.body.deliveryMethod,
        plannedDeliveryDate: req.body.plannedDeliveryDate,
        deliveryAddress: req.body.deliveryAddress || store.address.street
      },
      statusHistory: [{
        status: '待确认',
        notes: '订单创建',
        operator: req.user.userId
      }]
    };

    const order = new Order(orderData);
    await order.save();

    await order.populate([
      { path: 'store', select: 'storeName storeCode owner' },
      { path: 'salesRep', select: 'realName phone' },
      { path: 'items.product', select: 'productCode productName brand' }
    ]);

    store.orderHistory.totalOrders += 1;
    store.orderHistory.totalAmount += totalAmount;
    store.orderHistory.lastOrderDate = new Date();
    store.orderHistory.avgOrderValue = store.orderHistory.totalAmount / store.orderHistory.totalOrders;
    await store.save();

    res.status(201).json({
      success: true,
      message: '订单创建成功',
      data: { order }
    });

  } catch (error) {
    console.error('创建订单错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '创建订单失败' 
    });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      salesRep: req.user.userId
    })
    .populate('store', 'storeName storeCode owner address')
    .populate('salesRep', 'realName phone')
    .populate('items.product', 'productCode productName brand specifications')
    .populate('statusHistory.operator', 'realName');

    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: '订单不存在或无权限访问' 
      });
    }

    res.json({
      success: true,
      data: { order }
    });

  } catch (error) {
    console.error('获取订单详情错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '获取订单详情失败' 
    });
  }
});

// 确认订单
router.put('/:id/confirm', authenticateToken, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      salesRep: req.user.userId
    });

    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: '订单不存在或无权限修改' 
      });
    }

    order.orderStatus = '已确认';
    order.statusHistory.push({
      status: '已确认',
      notes: '订单已确认',
      operator: req.user.userId
    });

    await order.save();

    res.json({
      success: true,
      message: '订单确认成功',
      data: { 
        orderStatus: order.orderStatus,
        statusHistory: order.statusHistory
      }
    });

  } catch (error) {
    console.error('确认订单错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '确认订单失败' 
    });
  }
});

// 拒绝订单
router.put('/:id/reject', authenticateToken, async (req, res) => {
  try {
    const { reason } = req.body;
    
    const order = await Order.findOne({
      _id: req.params.id,
      salesRep: req.user.userId
    });

    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: '订单不存在或无权限修改' 
      });
    }

    order.orderStatus = '已取消';
    order.statusHistory.push({
      status: '已取消',
      notes: reason || '订单被拒绝',
      operator: req.user.userId
    });

    await order.save();

    res.json({
      success: true,
      message: '订单已拒绝',
      data: { 
        orderStatus: order.orderStatus,
        statusHistory: order.statusHistory
      }
    });

  } catch (error) {
    console.error('拒绝订单错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '拒绝订单失败' 
    });
  }
});

router.put('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { status, notes } = req.body;
    
    const validStatuses = ['待确认', '已确认', '配货中', '配送中', '已送达', '已完成', '已取消'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: '无效的订单状态' 
      });
    }

    const order = await Order.findOne({
      _id: req.params.id,
      salesRep: req.user.userId
    });

    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: '订单不存在或无权限修改' 
      });
    }

    order.orderStatus = status;
    order.statusHistory.push({
      status,
      notes: notes || '',
      operator: req.user.userId
    });

    if (status === '已送达') {
      order.deliveryInfo.actualDeliveryDate = new Date();
    }

    await order.save();

    res.json({
      success: true,
      message: '订单状态更新成功',
      data: { 
        orderStatus: order.orderStatus,
        statusHistory: order.statusHistory
      }
    });

  } catch (error) {
    console.error('更新订单状态错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '更新订单状态失败' 
    });
  }
});

router.get('/stats/summary', authenticateToken, async (req, res) => {
  try {
    const salesRepId = req.user.userId;
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));

    const [monthlyStats, weeklyStats, statusStats] = await Promise.all([
      Order.aggregate([
        {
          $match: {
            salesRep: salesRepId,
            createdAt: { $gte: startOfMonth }
          }
        },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalAmount: { $sum: '$orderSummary.totalAmount' },
            avgOrderValue: { $avg: '$orderSummary.totalAmount' }
          }
        }
      ]),
      Order.aggregate([
        {
          $match: {
            salesRep: salesRepId,
            createdAt: { $gte: startOfWeek }
          }
        },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalAmount: { $sum: '$orderSummary.totalAmount' }
          }
        }
      ]),
      Order.aggregate([
        { $match: { salesRep: salesRepId } },
        {
          $group: {
            _id: '$orderStatus',
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    const summary = {
      monthly: monthlyStats[0] || { totalOrders: 0, totalAmount: 0, avgOrderValue: 0 },
      weekly: weeklyStats[0] || { totalOrders: 0, totalAmount: 0 },
      statusBreakdown: statusStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {})
    };

    res.json({
      success: true,
      data: { summary }
    });

  } catch (error) {
    console.error('获取订单统计错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '获取订单统计失败' 
    });
  }
});

module.exports = router;