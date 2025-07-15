const express = require('express');
const mongoose = require('mongoose');
const Store = require('../models/Store');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { authenticateToken } = require('./auth');

const router = express.Router();

router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    const salesRepId = req.user.userId;
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);

    const [
      storeStats,
      orderStats,
      productStats,
      salesTrend
    ] = await Promise.all([
      this.getStoreAnalytics(salesRepId, startOfMonth),
      this.getOrderAnalytics(salesRepId, startOfMonth, lastMonth, endOfLastMonth),
      this.getProductAnalytics(salesRepId, startOfMonth),
      this.getSalesTrend(salesRepId)
    ]);

    res.json({
      success: true,
      data: {
        storeStats,
        orderStats,
        productStats,
        salesTrend,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('获取数据分析错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '获取数据分析失败' 
    });
  }
});

router.get('/stores/performance', authenticateToken, async (req, res) => {
  try {
    const salesRepId = req.user.userId;
    
    const storePerformance = await Store.aggregate([
      { $match: { salesRep: salesRepId } },
      {
        $lookup: {
          from: 'orders',
          localField: '_id',
          foreignField: 'store',
          as: 'orders'
        }
      },
      {
        $addFields: {
          totalOrders: { $size: '$orders' },
          totalRevenue: {
            $sum: '$orders.orderSummary.totalAmount'
          },
          avgOrderValue: {
            $cond: {
              if: { $gt: [{ $size: '$orders' }, 0] },
              then: {
                $divide: [
                  { $sum: '$orders.orderSummary.totalAmount' },
                  { $size: '$orders' }
                ]
              },
              else: 0
            }
          },
          lastOrderDate: { $max: '$orders.createdAt' }
        }
      },
      {
        $project: {
          storeName: 1,
          storeCode: 1,
          businessStatus: 1,
          'address.city': 1,
          totalOrders: 1,
          totalRevenue: 1,
          avgOrderValue: 1,
          lastOrderDate: 1,
          daysSinceLastOrder: {
            $cond: {
              if: '$lastOrderDate',
              then: {
                $divide: [
                  { $subtract: [new Date(), '$lastOrderDate'] },
                  1000 * 60 * 60 * 24
                ]
              },
              else: null
            }
          }
        }
      },
      { $sort: { totalRevenue: -1 } }
    ]);

    const storeTypeAnalysis = await Store.aggregate([
      { $match: { salesRep: salesRepId } },
      {
        $group: {
          _id: '$storeInfo.storeType',
          count: { $sum: 1 },
          avgRevenue: { $avg: '$orderHistory.totalAmount' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        storePerformance,
        storeTypeAnalysis
      }
    });

  } catch (error) {
    console.error('获取门店业绩分析错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '获取门店业绩分析失败' 
    });
  }
});

router.get('/products/analysis', authenticateToken, async (req, res) => {
  try {
    const salesRepId = req.user.userId;
    
    const productSalesAnalysis = await Order.aggregate([
      { $match: { salesRep: salesRepId } },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'productInfo'
        }
      },
      { $unwind: '$productInfo' },
      {
        $group: {
          _id: '$items.product',
          productName: { $first: '$productInfo.productName' },
          productCode: { $first: '$productInfo.productCode' },
          brand: { $first: '$productInfo.brand' },
          category: { $first: '$productInfo.category.primary' },
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.finalPrice' },
          orderCount: { $sum: 1 },
          avgPrice: { $avg: '$items.unitPrice' }
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 50 }
    ]);

    const categoryAnalysis = await Order.aggregate([
      { $match: { salesRep: salesRepId } },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'productInfo'
        }
      },
      { $unwind: '$productInfo' },
      {
        $group: {
          _id: '$productInfo.category.primary',
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.finalPrice' },
          productCount: { $addToSet: '$items.product' }
        }
      },
      {
        $addFields: {
          productCount: { $size: '$productCount' }
        }
      },
      { $sort: { totalRevenue: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        productSalesAnalysis,
        categoryAnalysis
      }
    });

  } catch (error) {
    console.error('获取产品分析错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '获取产品分析失败' 
    });
  }
});

router.get('/sales/trend', authenticateToken, async (req, res) => {
  try {
    const salesRepId = req.user.userId;
    const { period = 'month', months = 12 } = req.query;
    
    let startDate;
    if (period === 'month') {
      startDate = new Date();
      startDate.setMonth(startDate.getMonth() - parseInt(months));
    } else {
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
    }

    const salesTrend = await Order.aggregate([
      {
        $match: {
          salesRep: salesRepId,
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            ...(period === 'day' && { day: { $dayOfMonth: '$createdAt' } })
          },
          totalOrders: { $sum: 1 },
          totalAmount: { $sum: '$orderSummary.totalAmount' },
          avgOrderValue: { $avg: '$orderSummary.totalAmount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    const comparison = await this.getSalesComparison(salesRepId);

    res.json({
      success: true,
      data: {
        salesTrend,
        comparison,
        period
      }
    });

  } catch (error) {
    console.error('获取销售趋势错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '获取销售趋势失败' 
    });
  }
});

router.get('/performance', authenticateToken, async (req, res) => {
  try {
    const salesRepId = req.user.userId;
    const user = await require('../models/User').findById(salesRepId);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: '用户不存在' 
      });
    }

    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    const monthlyPerformance = await Order.aggregate([
      {
        $match: {
          salesRep: salesRepId,
          createdAt: { $gte: startOfMonth }
        }
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$orderSummary.totalAmount' },
          totalOrders: { $sum: 1 }
        }
      }
    ]);

    const currentMonth = monthlyPerformance[0]?.totalAmount || 0;
    const target = user.salesTarget.monthly || 1;
    const completion = (currentMonth / target) * 100;

    res.json({
      success: true,
      data: {
        performance: {
          currentMonth,
          target,
          completion: Math.min(completion, 100),
          remaining: Math.max(target - currentMonth, 0)
        }
      }
    });

  } catch (error) {
    console.error('获取业绩数据错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '获取业绩数据失败' 
    });
  }
});

router.getStoreAnalytics = async function(salesRepId, startOfMonth) {
  const storeStats = await Store.aggregate([
    { $match: { salesRep: salesRepId } },
    {
      $group: {
        _id: '$businessStatus',
        count: { $sum: 1 }
      }
    }
  ]);

  const newStores = await Store.countDocuments({
    salesRep: salesRepId,
    createdAt: { $gte: startOfMonth }
  });

  return {
    byStatus: storeStats,
    newThisMonth: newStores
  };
};

router.getOrderAnalytics = async function(salesRepId, startOfMonth, lastMonth, endOfLastMonth) {
  const [currentMonth, previousMonth] = await Promise.all([
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
          createdAt: { $gte: lastMonth, $lte: endOfLastMonth }
        }
      },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalAmount: { $sum: '$orderSummary.totalAmount' }
        }
      }
    ])
  ]);

  const current = currentMonth[0] || { totalOrders: 0, totalAmount: 0, avgOrderValue: 0 };
  const previous = previousMonth[0] || { totalOrders: 0, totalAmount: 0 };

  return {
    current,
    previous,
    growth: {
      orders: previous.totalOrders > 0 ? ((current.totalOrders - previous.totalOrders) / previous.totalOrders * 100) : 0,
      amount: previous.totalAmount > 0 ? ((current.totalAmount - previous.totalAmount) / previous.totalAmount * 100) : 0
    }
  };
};

router.getProductAnalytics = async function(salesRepId, startOfMonth) {
  return await Order.aggregate([
    {
      $match: {
        salesRep: salesRepId,
        createdAt: { $gte: startOfMonth }
      }
    },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.product',
        totalQuantity: { $sum: '$items.quantity' },
        totalRevenue: { $sum: '$items.finalPrice' }
      }
    },
    { $sort: { totalRevenue: -1 } },
    { $limit: 10 }
  ]);
};

router.getSalesTrend = async function(salesRepId) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  return await Order.aggregate([
    {
      $match: {
        salesRep: salesRepId,
        createdAt: { $gte: thirtyDaysAgo }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        },
        totalAmount: { $sum: '$orderSummary.totalAmount' },
        orderCount: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
  ]);
};

router.getSalesComparison = async function(salesRepId) {
  const today = new Date();
  const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000);

  const [thisWeek, previousWeek] = await Promise.all([
    Order.aggregate([
      {
        $match: {
          salesRep: salesRepId,
          createdAt: { $gte: lastWeek }
        }
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$orderSummary.totalAmount' },
          totalOrders: { $sum: 1 }
        }
      }
    ]),
    Order.aggregate([
      {
        $match: {
          salesRep: salesRepId,
          createdAt: { $gte: twoWeeksAgo, $lt: lastWeek }
        }
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$orderSummary.totalAmount' },
          totalOrders: { $sum: 1 }
        }
      }
    ])
  ]);

  return {
    thisWeek: thisWeek[0] || { totalAmount: 0, totalOrders: 0 },
    previousWeek: previousWeek[0] || { totalAmount: 0, totalOrders: 0 }
  };
};

module.exports = router;