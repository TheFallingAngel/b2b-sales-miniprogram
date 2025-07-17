const express = require('express');
const { authenticateToken } = require('./auth');

const router = express.Router();

// 获取今日安排
router.get('/today', authenticateToken, async (req, res) => {
  try {
    const salesRepId = req.user.userId;
    const today = new Date();
    
    // 模拟今日安排数据，实际应该从数据库获取
    const schedule = [
      {
        id: '1',
        time: '09:00',
        title: '拜访华联超市',
        description: '南山店 - 补货洽谈',
        type: 'visit',
        status: 'completed',
        statusText: '已完成',
        storeId: null,
        location: '深圳市南山区'
      },
      {
        id: '2',
        time: '14:00',
        title: '客户会议',
        description: '永辉超市 - 月度总结',
        type: 'meeting',
        status: 'pending',
        statusText: '待进行',
        storeId: null,
        location: '福田区'
      },
      {
        id: '3',
        time: '16:30',
        title: '新店开发',
        description: '福田区市场调研',
        type: 'development',
        status: 'pending',
        statusText: '待进行',
        storeId: null,
        location: '福田区'
      }
    ];

    res.json({
      success: true,
      data: { schedule }
    });

  } catch (error) {
    console.error('获取今日安排错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '获取今日安排失败' 
    });
  }
});

// 添加日程安排
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, description, time, date, type, storeId } = req.body;
    
    // 实际应用中应该保存到数据库
    const schedule = {
      id: Date.now().toString(),
      title,
      description,
      time,
      date,
      type,
      storeId,
      status: 'pending',
      statusText: '待进行',
      salesRep: req.user.userId,
      createdAt: new Date()
    };

    res.status(201).json({
      success: true,
      message: '日程安排添加成功',
      data: { schedule }
    });

  } catch (error) {
    console.error('添加日程安排错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '添加日程安排失败' 
    });
  }
});

// 更新日程状态
router.put('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;
    
    // 实际应用中应该更新数据库
    const statusMap = {
      'pending': '待进行',
      'in_progress': '进行中',
      'completed': '已完成',
      'cancelled': '已取消'
    };

    res.json({
      success: true,
      message: '日程状态更新成功',
      data: { 
        status,
        statusText: statusMap[status] || '未知状态'
      }
    });

  } catch (error) {
    console.error('更新日程状态错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '更新日程状态失败' 
    });
  }
});

module.exports = router;