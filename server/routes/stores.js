const express = require('express');
const Joi = require('joi');
const Store = require('../models/Store');
const { authenticateToken } = require('./auth');

const router = express.Router();

const storeSchema = Joi.object({
  storeName: Joi.string().min(2).max(50).required(),
  owner: Joi.object({
    name: Joi.string().min(2).max(20).required(),
    phone: Joi.string().pattern(/^1[3-9]\d{9}$/).required(),
    idCard: Joi.string().optional(),
    wechat: Joi.string().optional()
  }).required(),
  address: Joi.object({
    province: Joi.string().required(),
    city: Joi.string().required(),
    district: Joi.string().required(),
    street: Joi.string().required(),
    coordinates: Joi.object({
      longitude: Joi.number(),
      latitude: Joi.number()
    }).optional()
  }).required(),
  storeInfo: Joi.object({
    storeType: Joi.string().valid('超市', '便利店', '小卖部', '餐饮店', '其他').required(),
    businessHours: Joi.object({
      open: Joi.string(),
      close: Joi.string()
    }).optional(),
    storeSize: Joi.string().valid('小型(<50平)', '中型(50-200平)', '大型(>200平)').optional(),
    monthlyRevenue: Joi.string().valid('<1万', '1-5万', '5-10万', '10-20万', '>20万').optional()
  }).required()
});

router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, region, search } = req.query;
    const query = { salesRep: req.user.userId };

    if (status) query.businessStatus = status;
    if (region) query['address.city'] = region;
    if (search) {
      query.$or = [
        { storeName: { $regex: search, $options: 'i' } },
        { 'owner.name': { $regex: search, $options: 'i' } },
        { 'owner.phone': { $regex: search, $options: 'i' } }
      ];
    }

    const stores = await Store.find(query)
      .populate('salesRep', 'realName phone')
      .sort({ updatedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Store.countDocuments(query);

    // 获取统计数据
    const stats = await Store.aggregate([
      { $match: { salesRep: req.user.userId } },
      {
        $group: {
          _id: '$businessStatus',
          count: { $sum: 1 }
        }
      }
    ]);

    const statsMap = {};
    stats.forEach(stat => {
      statsMap[stat._id] = stat.count;
    });

    res.json({
      success: true,
      data: {
        stores,
        total,
        stats: {
          active: statsMap['活跃客户'] || 0,
          potential: statsMap['潜在客户'] || 0,
          inactive: statsMap['流失客户'] || 0
        },
        pagination: {
          current: parseInt(page),
          pageSize: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('获取门店列表错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '获取门店列表失败' 
    });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { error } = storeSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        success: false, 
        message: '门店信息格式错误',
        details: error.details[0].message
      });
    }

    const timestamp = Date.now().toString();
    const storeCode = `ST${timestamp.slice(-8)}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

    const storeData = {
      ...req.body,
      storeCode,
      salesRep: req.user.userId,
      visitHistory: [{
        purpose: '首次拜访',
        notes: '初始建档',
        salesRep: req.user.userId
      }]
    };

    const store = new Store(storeData);
    await store.save();

    await store.populate('salesRep', 'realName phone');

    res.status(201).json({
      success: true,
      message: '门店创建成功',
      data: { store }
    });

  } catch (error) {
    console.error('创建门店错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '创建门店失败' 
    });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const store = await Store.findOne({
      _id: req.params.id,
      salesRep: req.user.userId
    }).populate('salesRep', 'realName phone')
      .populate('visitHistory.salesRep', 'realName');

    if (!store) {
      return res.status(404).json({ 
        success: false, 
        message: '门店不存在或无权限访问' 
      });
    }

    res.json({
      success: true,
      data: { store }
    });

  } catch (error) {
    console.error('获取门店详情错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '获取门店详情失败' 
    });
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const store = await Store.findOneAndUpdate(
      { _id: req.params.id, salesRep: req.user.userId },
      req.body,
      { new: true, runValidators: true }
    ).populate('salesRep', 'realName phone');

    if (!store) {
      return res.status(404).json({ 
        success: false, 
        message: '门店不存在或无权限修改' 
      });
    }

    res.json({
      success: true,
      message: '门店信息更新成功',
      data: { store }
    });

  } catch (error) {
    console.error('更新门店错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '更新门店失败' 
    });
  }
});

router.post('/:id/visit', authenticateToken, async (req, res) => {
  try {
    const { purpose, notes, photos } = req.body;
    
    const store = await Store.findOne({
      _id: req.params.id,
      salesRep: req.user.userId
    });

    if (!store) {
      return res.status(404).json({ 
        success: false, 
        message: '门店不存在或无权限访问' 
      });
    }

    store.visitHistory.push({
      purpose,
      notes,
      photos: photos || [],
      salesRep: req.user.userId
    });

    await store.save();

    res.json({
      success: true,
      message: '拜访记录添加成功',
      data: { 
        visitRecord: store.visitHistory[store.visitHistory.length - 1]
      }
    });

  } catch (error) {
    console.error('添加拜访记录错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '添加拜访记录失败' 
    });
  }
});

router.get('/stats/summary', authenticateToken, async (req, res) => {
  try {
    const salesRepId = req.user.userId;
    
    const stats = await Store.aggregate([
      { $match: { salesRep: salesRepId } },
      {
        $group: {
          _id: '$businessStatus',
          count: { $sum: 1 }
        }
      }
    ]);

    const summary = {
      总门店数: 0,
      潜在客户: 0,
      意向客户: 0,
      合作客户: 0,
      流失客户: 0
    };

    stats.forEach(stat => {
      summary[stat._id] = stat.count;
      summary.总门店数 += stat.count;
    });

    res.json({
      success: true,
      data: { summary }
    });

  } catch (error) {
    console.error('获取门店统计错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '获取门店统计失败' 
    });
  }
});

module.exports = router;