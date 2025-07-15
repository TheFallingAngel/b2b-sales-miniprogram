const express = require('express');
const Product = require('../models/Product');
const { authenticateToken } = require('./auth');

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      category, 
      brand, 
      search, 
      inStock = true,
      priority 
    } = req.query;

    const query = { isActive: true };
    
    if (category) query['category.primary'] = category;
    if (brand) query.brand = brand;
    if (priority) query.priority = priority;
    if (inStock === 'true') query['inventory.availableStock'] = { $gt: 0 };
    
    if (search) {
      query.$or = [
        { productName: { $regex: search, $options: 'i' } },
        { productCode: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } }
      ];
    }

    const products = await Product.find(query)
      .sort({ priority: -1, updatedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-__v');

    const total = await Product.countDocuments(query);

    const categories = await Product.distinct('category.primary', { isActive: true });
    const brands = await Product.distinct('brand', { isActive: true });

    res.json({
      success: true,
      data: {
        products,
        pagination: {
          current: parseInt(page),
          pageSize: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        },
        filters: { categories, brands }
      }
    });

  } catch (error) {
    console.error('获取产品列表错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '获取产品列表失败' 
    });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      isActive: true
    });

    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: '产品不存在' 
      });
    }

    res.json({
      success: true,
      data: { product }
    });

  } catch (error) {
    console.error('获取产品详情错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '获取产品详情失败' 
    });
  }
});

router.get('/inventory/check', authenticateToken, async (req, res) => {
  try {
    const { productIds } = req.query;
    
    if (!productIds) {
      return res.status(400).json({ 
        success: false, 
        message: '产品ID列表不能为空' 
      });
    }

    const ids = productIds.split(',');
    const products = await Product.find({
      _id: { $in: ids },
      isActive: true
    }).select('productCode productName inventory pricing');

    const inventory = products.map(product => ({
      productId: product._id,
      productCode: product.productCode,
      productName: product.productName,
      availableStock: product.inventory.availableStock,
      safetyStock: product.inventory.safetyStock,
      isInStock: product.inventory.availableStock > 0,
      isLowStock: product.inventory.availableStock <= product.inventory.safetyStock,
      wholesalePrice: product.pricing.wholesalePrice,
      minOrderQty: product.pricing.minOrderQty
    }));

    res.json({
      success: true,
      data: { inventory }
    });

  } catch (error) {
    console.error('检查库存错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '检查库存失败' 
    });
  }
});

router.get('/promotions/active', authenticateToken, async (req, res) => {
  try {
    const now = new Date();
    
    const promotions = await Product.find({
      isActive: true,
      'promotion.isOnPromotion': true,
      'promotion.startDate': { $lte: now },
      'promotion.endDate': { $gte: now }
    }).select('productCode productName brand pricing promotion inventory');

    res.json({
      success: true,
      data: { promotions }
    });

  } catch (error) {
    console.error('获取促销产品错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '获取促销产品失败' 
    });
  }
});

router.get('/stats/top-selling', authenticateToken, async (req, res) => {
  try {
    const { limit = 10, period = 'month' } = req.query;
    
    const topProducts = await Product.find({ isActive: true })
      .sort({ 'salesData.currentMonthSales': -1 })
      .limit(parseInt(limit))
      .select('productCode productName brand salesData pricing');

    res.json({
      success: true,
      data: { topProducts }
    });

  } catch (error) {
    console.error('获取热销产品错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '获取热销产品失败' 
    });
  }
});

router.get('/categories/tree', authenticateToken, async (req, res) => {
  try {
    const categories = await Product.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: {
            primary: '$category.primary',
            secondary: '$category.secondary'
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.primary',
          subcategories: {
            $push: {
              name: '$_id.secondary',
              count: '$count'
            }
          },
          totalCount: { $sum: '$count' }
        }
      },
      { $sort: { totalCount: -1 } }
    ]);

    res.json({
      success: true,
      data: { categories }
    });

  } catch (error) {
    console.error('获取分类树错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '获取分类树失败' 
    });
  }
});

module.exports = router;