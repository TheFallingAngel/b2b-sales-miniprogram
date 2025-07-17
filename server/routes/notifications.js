const express = require('express');
const { authenticateToken } = require('./auth');

const router = express.Router();

// 获取最近通知
router.get('/recent', authenticateToken, async (req, res) => {
  try {
    const salesRepId = req.user.userId;
    
    // 模拟通知数据，实际应该从数据库获取
    const notifications = [
      {
        id: '1',
        title: '订单确认提醒',
        content: '您有3个订单待确认，请及时处理',
        type: 'order',
        icon: '📦',
        read: false,
        createdAt: new Date(Date.now() - 10 * 60 * 1000), // 10分钟前
        timeAgo: '10分钟前'
      },
      {
        id: '2',
        title: '新产品上架通知',
        content: '可口可乐系列产品已上架，快去查看吧',
        type: 'product',
        icon: '🆕',
        read: false,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2小时前
        timeAgo: '2小时前'
      },
      {
        id: '3',
        title: '拜访提醒',
        content: '华联超市已3天未拜访，建议今日拜访',
        type: 'visit',
        icon: '🏪',
        read: true,
        createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5小时前
        timeAgo: '5小时前'
      }
    ];

    res.json({
      success: true,
      data: { notifications }
    });

  } catch (error) {
    console.error('获取通知错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '获取通知失败' 
    });
  }
});

// 标记通知已读
router.put('/:id/read', authenticateToken, async (req, res) => {
  try {
    // 实际应用中应该更新数据库
    res.json({
      success: true,
      message: '通知已标记为已读'
    });

  } catch (error) {
    console.error('标记通知已读错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '操作失败' 
    });
  }
});

module.exports = router;