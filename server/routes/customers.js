const express = require('express');
const Store = require('../models/Store');
const Order = require('../models/Order');
const { authenticateToken } = require('./auth');

const router = express.Router();

router.get('/potential', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, region, storeType } = req.query;
    const salesRepId = req.user.userId;
    
    const query = {
      salesRep: salesRepId,
      businessStatus: { $in: ['潜在客户', '意向客户'] }
    };
    
    if (region) query['address.city'] = region;
    if (storeType) query['storeInfo.storeType'] = storeType;

    const potentialCustomers = await Store.find(query)
      .populate('salesRep', 'realName phone')
      .sort({ updatedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Store.countDocuments(query);

    const analysisData = await this.analyzePotentialCustomers(salesRepId);

    res.json({
      success: true,
      data: {
        customers: potentialCustomers,
        pagination: {
          current: parseInt(page),
          pageSize: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        },
        analysis: analysisData
      }
    });

  } catch (error) {
    console.error('获取潜在客户错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '获取潜在客户失败' 
    });
  }
});

router.get('/lifecycle', authenticateToken, async (req, res) => {
  try {
    const salesRepId = req.user.userId;
    
    const lifecycleAnalysis = await Store.aggregate([
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
          orderCount: { $size: '$orders' },
          totalRevenue: { $sum: '$orders.orderSummary.totalAmount' },
          firstOrderDate: { $min: '$orders.createdAt' },
          lastOrderDate: { $max: '$orders.createdAt' },
          daysSinceFirstOrder: {
            $cond: {
              if: { $gt: [{ $size: '$orders' }, 0] },
              then: {
                $divide: [
                  { $subtract: [new Date(), { $min: '$orders.createdAt' }] },
                  1000 * 60 * 60 * 24
                ]
              },
              else: null
            }
          },
          daysSinceLastOrder: {
            $cond: {
              if: { $gt: [{ $size: '$orders' }, 0] },
              then: {
                $divide: [
                  { $subtract: [new Date(), { $max: '$orders.createdAt' }] },
                  1000 * 60 * 60 * 24
                ]
              },
              else: null
            }
          }
        }
      },
      {
        $addFields: {
          customerStage: {
            $switch: {
              branches: [
                { case: { $eq: ['$orderCount', 0] }, then: '潜在客户' },
                { case: { $and: [{ $gte: ['$orderCount', 1] }, { $lt: ['$orderCount', 3] }] }, then: '新客户' },
                { case: { $and: [{ $gte: ['$orderCount', 3] }, { $lt: ['$daysSinceLastOrder', 30] }] }, then: '活跃客户' },
                { case: { $and: [{ $gte: ['$orderCount', 3] }, { $gte: ['$daysSinceLastOrder', 30] }, { $lt: ['$daysSinceLastOrder', 90] }] }, then: '沉睡客户' },
                { case: { $gte: ['$daysSinceLastOrder', 90] }, then: '流失客户' }
              ],
              default: '未知'
            }
          },
          customerValue: {
            $switch: {
              branches: [
                { case: { $gte: ['$totalRevenue', 50000] }, then: '高价值' },
                { case: { $gte: ['$totalRevenue', 20000] }, then: '中价值' },
                { case: { $gte: ['$totalRevenue', 5000] }, then: '低价值' }
              ],
              default: '潜在价值'
            }
          }
        }
      },
      {
        $group: {
          _id: {
            stage: '$customerStage',
            value: '$customerValue'
          },
          count: { $sum: 1 },
          totalRevenue: { $sum: '$totalRevenue' },
          avgRevenue: { $avg: '$totalRevenue' },
          customers: {
            $push: {
              _id: '$_id',
              storeName: '$storeName',
              storeCode: '$storeCode',
              orderCount: '$orderCount',
              totalRevenue: '$totalRevenue',
              lastOrderDate: '$lastOrderDate',
              daysSinceLastOrder: '$daysSinceLastOrder'
            }
          }
        }
      },
      { $sort: { '_id.stage': 1, '_id.value': -1 } }
    ]);

    const stageStats = await Store.aggregate([
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
          orderCount: { $size: '$orders' },
          daysSinceLastOrder: {
            $cond: {
              if: { $gt: [{ $size: '$orders' }, 0] },
              then: {
                $divide: [
                  { $subtract: [new Date(), { $max: '$orders.createdAt' }] },
                  1000 * 60 * 60 * 24
                ]
              },
              else: 999
            }
          }
        }
      },
      {
        $addFields: {
          customerStage: {
            $switch: {
              branches: [
                { case: { $eq: ['$orderCount', 0] }, then: '潜在客户' },
                { case: { $and: [{ $gte: ['$orderCount', 1] }, { $lt: ['$orderCount', 3] }] }, then: '新客户' },
                { case: { $and: [{ $gte: ['$orderCount', 3] }, { $lt: ['$daysSinceLastOrder', 30] }] }, then: '活跃客户' },
                { case: { $and: [{ $gte: ['$orderCount', 3] }, { $gte: ['$daysSinceLastOrder', 30] }, { $lt: ['$daysSinceLastOrder', 90] }] }, then: '沉睡客户' },
                { case: { $gte: ['$daysSinceLastOrder', 90] }, then: '流失客户' }
              ],
              default: '未知'
            }
          }
        }
      },
      {
        $group: {
          _id: '$customerStage',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        lifecycleAnalysis,
        stageStats
      }
    });

  } catch (error) {
    console.error('获取客户生命周期分析错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '获取客户生命周期分析失败' 
    });
  }
});

router.get('/retention', authenticateToken, async (req, res) => {
  try {
    const salesRepId = req.user.userId;
    
    const retentionAnalysis = await Order.aggregate([
      { $match: { salesRep: salesRepId } },
      {
        $group: {
          _id: '$store',
          orders: {
            $push: {
              date: '$createdAt',
              amount: '$orderSummary.totalAmount'
            }
          },
          firstOrder: { $min: '$createdAt' },
          lastOrder: { $max: '$createdAt' },
          totalOrders: { $sum: 1 },
          totalAmount: { $sum: '$orderSummary.totalAmount' }
        }
      },
      {
        $lookup: {
          from: 'stores',
          localField: '_id',
          foreignField: '_id',
          as: 'storeInfo'
        }
      },
      { $unwind: '$storeInfo' },
      {
        $addFields: {
          daysBetweenFirstAndLast: {
            $divide: [
              { $subtract: ['$lastOrder', '$firstOrder'] },
              1000 * 60 * 60 * 24
            ]
          },
          avgDaysBetweenOrders: {
            $cond: {
              if: { $gt: ['$totalOrders', 1] },
              then: {
                $divide: [
                  { $divide: [{ $subtract: ['$lastOrder', '$firstOrder'] }, 1000 * 60 * 60 * 24] },
                  { $subtract: ['$totalOrders', 1] }
                ]
              },
              else: null
            }
          }
        }
      },
      {
        $addFields: {
          retentionRate: {
            $cond: {
              if: { $gt: ['$totalOrders', 1] },
              then: {
                $multiply: [
                  { $divide: [{ $subtract: ['$totalOrders', 1] }, '$totalOrders'] },
                  100
                ]
              },
              else: 0
            }
          }
        }
      },
      { $sort: { totalAmount: -1 } }
    ]);

    const churned = await Store.aggregate([
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
        $match: {
          'orders.0': { $exists: true }
        }
      },
      {
        $addFields: {
          lastOrderDate: { $max: '$orders.createdAt' },
          daysSinceLastOrder: {
            $divide: [
              { $subtract: [new Date(), { $max: '$orders.createdAt' }] },
              1000 * 60 * 60 * 24
            ]
          }
        }
      },
      {
        $match: {
          daysSinceLastOrder: { $gte: 90 }
        }
      },
      {
        $project: {
          storeName: 1,
          storeCode: 1,
          lastOrderDate: 1,
          daysSinceLastOrder: 1,
          totalOrders: { $size: '$orders' },
          totalRevenue: { $sum: '$orders.orderSummary.totalAmount' }
        }
      },
      { $sort: { daysSinceLastOrder: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        retentionAnalysis,
        churnedCustomers: churned,
        summary: {
          totalActiveCustomers: retentionAnalysis.length,
          churnedCustomers: churned.length,
          avgRetentionRate: retentionAnalysis.reduce((sum, item) => sum + item.retentionRate, 0) / retentionAnalysis.length || 0
        }
      }
    });

  } catch (error) {
    console.error('获取客户保留分析错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '获取客户保留分析失败' 
    });
  }
});

router.get('/acquisition', authenticateToken, async (req, res) => {
  try {
    const salesRepId = req.user.userId;
    const { months = 6 } = req.query;
    
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - parseInt(months));

    const acquisitionTrend = await Store.aggregate([
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
            month: { $month: '$createdAt' }
          },
          newStores: { $sum: 1 },
          storeTypes: { $push: '$storeInfo.storeType' }
        }
      },
      {
        $addFields: {
          storeTypeBreakdown: {
            $reduce: {
              input: '$storeTypes',
              initialValue: {},
              in: {
                $mergeObjects: [
                  '$$value',
                  {
                    $arrayToObject: [[{ k: '$$this', v: { $add: [{ $ifNull: [{ $getField: { field: '$$this', input: '$$value' } }, 0] }, 1] } }]]
                  }
                ]
              }
            }
          }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    const conversionFunnel = await Store.aggregate([
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
          hasOrders: { $gt: [{ $size: '$orders' }, 0] },
          firstOrderDays: {
            $cond: {
              if: { $gt: [{ $size: '$orders' }, 0] },
              then: {
                $divide: [
                  { $subtract: [{ $min: '$orders.createdAt' }, '$createdAt'] },
                  1000 * 60 * 60 * 24
                ]
              },
              else: null
            }
          }
        }
      },
      {
        $group: {
          _id: '$businessStatus',
          count: { $sum: 1 },
          converted: { $sum: { $cond: ['$hasOrders', 1, 0] } },
          avgDaysToFirstOrder: { $avg: '$firstOrderDays' }
        }
      },
      {
        $addFields: {
          conversionRate: {
            $multiply: [{ $divide: ['$converted', '$count'] }, 100]
          }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        acquisitionTrend,
        conversionFunnel
      }
    });

  } catch (error) {
    console.error('获取客户获取分析错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '获取客户获取分析失败' 
    });
  }
});

router.analyzePotentialCustomers = async function(salesRepId) {
  const [storeTypeAnalysis, regionAnalysis, visitAnalysis] = await Promise.all([
    Store.aggregate([
      {
        $match: {
          salesRep: salesRepId,
          businessStatus: { $in: ['潜在客户', '意向客户'] }
        }
      },
      {
        $group: {
          _id: '$storeInfo.storeType',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]),
    Store.aggregate([
      {
        $match: {
          salesRep: salesRepId,
          businessStatus: { $in: ['潜在客户', '意向客户'] }
        }
      },
      {
        $group: {
          _id: '$address.city',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]),
    Store.aggregate([
      {
        $match: {
          salesRep: salesRepId,
          businessStatus: { $in: ['潜在客户', '意向客户'] }
        }
      },
      {
        $addFields: {
          daysSinceLastVisit: {
            $cond: {
              if: { $gt: [{ $size: '$visitHistory' }, 0] },
              then: {
                $divide: [
                  { $subtract: [new Date(), { $max: '$visitHistory.date' }] },
                  1000 * 60 * 60 * 24
                ]
              },
              else: 999
            }
          }
        }
      },
      {
        $bucket: {
          groupBy: '$daysSinceLastVisit',
          boundaries: [0, 7, 14, 30, 90, 999],
          default: '999+',
          output: {
            count: { $sum: 1 },
            stores: { $push: { _id: '$_id', storeName: '$storeName', daysSinceLastVisit: '$daysSinceLastVisit' } }
          }
        }
      }
    ])
  ]);

  return {
    storeTypeAnalysis,
    regionAnalysis,
    visitAnalysis
  };
};

module.exports = router;