const app = getApp();

Page({
  data: {
    userInfo: {},
    currentDate: '',
    todayStats: {
      plannedVisits: 0,
      completedVisits: 0,
      newOrders: 0,
      todayRevenue: '¥0'
    },
    performance: {
      currentMonth: '¥0',
      completion: 0,
      target: '¥0',
      ranking: '-'
    },
    businessData: {
      totalStores: 0,
      activeStores: 0,
      pendingOrders: 0,
      monthlyRevenue: '¥0'
    },
    quickActions: [
      { id: 'scan_order', title: '扫码下单', icon: 'scan', color: '#4CAF50' },
      { id: 'visit_checkin', title: '拜访打卡', icon: 'location', color: '#2196F3' },
      { id: 'add_store', title: '新增门店', icon: 'store', color: '#FF9800' },
      { id: 'inventory', title: '库存查询', icon: 'boxes', color: '#9C27B0' }
    ],
    todoList: [],
    notifications: [],
    todaySchedule: [],
    loading: true,
    needLogin: false
  },

  onLoad() {
    this.setCurrentDate();
    this.setData({
      userInfo: app.globalData.userInfo || {}
    });
  },

  onShow() {
    if (app.globalData.userInfo) {
      this.loadDashboardData();
    } else {
      // 显示登录提示
      this.setData({
        needLogin: true,
        loading: false
      });
    }
  },

  setCurrentDate() {
    const now = new Date();
    const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const weekDay = weekDays[now.getDay()];
    
    this.setData({
      currentDate: `${month}月${day}日 星期${weekDay}`
    });
  },

  async loadDashboardData() {
    wx.showLoading({ title: '加载中...' });
    
    try {
      await Promise.all([
        this.loadTodayStats(),
        this.loadPerformanceData(),
        this.loadBusinessData(),
        this.loadTodoList(),
        this.loadNotifications(),
        this.loadTodaySchedule()
      ]);
    } catch (error) {
      console.error('加载仪表盘数据失败:', error);
      // 加载失败时显示模拟数据
      this.loadMockData();
    } finally {
      wx.hideLoading();
      this.setData({ loading: false });
    }
  },

  async loadTodayStats() {
    try {
      const res = await app.request({
        url: '/analytics/today-stats',
        method: 'GET'
      });

      if (res.success) {
        this.setData({
          todayStats: {
            plannedVisits: res.data.plannedVisits || 0,
            completedVisits: res.data.completedVisits || 0,
            newOrders: res.data.newOrders || 0,
            todayRevenue: app.formatMoney(res.data.todayRevenue || 0)
          }
        });
      }
    } catch (error) {
      console.error('加载今日统计失败:', error);
      // 使用模拟数据
      this.setData({
        todayStats: {
          plannedVisits: 8,
          completedVisits: 5,
          newOrders: 12,
          todayRevenue: '¥8,500'
        }
      });
    }
  },

  async loadPerformanceData() {
    try {
      const res = await app.request({
        url: '/analytics/performance',
        method: 'GET'
      });

      if (res.success) {
        const performance = res.data.performance;
        this.setData({
          performance: {
            currentMonth: app.formatMoney(performance.currentMonth),
            completion: Math.round(performance.completion || 0),
            target: app.formatMoney(performance.target),
            ranking: performance.ranking || '-'
          }
        });
      }
    } catch (error) {
      console.error('加载业绩数据失败:', error);
      // 使用模拟数据
      this.setData({
        performance: {
          currentMonth: '¥125,800',
          completion: 73,
          target: '¥180,000',
          ranking: '3'
        }
      });
    }
  },

  async loadBusinessData() {
    try {
      const res = await app.request({
        url: '/analytics/business-summary',
        method: 'GET'
      });

      if (res.success) {
        const data = res.data;
        this.setData({
          businessData: {
            totalStores: data.totalStores || 0,
            activeStores: data.activeStores || 0,
            pendingOrders: data.pendingOrders || 0,
            monthlyRevenue: app.formatMoney(data.monthlyRevenue || 0)
          }
        });
      }
    } catch (error) {
      console.error('加载业务数据失败:', error);
      // 使用模拟数据
      this.setData({
        businessData: {
          totalStores: 45,
          activeStores: 38,
          pendingOrders: 7,
          monthlyRevenue: '¥125,800'
        }
      });
    }
  },

  async loadTodoList() {
    try {
      const res = await app.request({
        url: '/analytics/todo-list',
        method: 'GET'
      });

      if (res.success) {
        this.setData({
          todoList: res.data.todos || []
        });
      }
    } catch (error) {
      console.error('加载待办事项失败:', error);
      // 使用模拟数据
      this.setData({
        todoList: [
          {
            id: '1',
            title: '拜访华联超市',
            description: '已7天未拜访，需要跟进补货情况',
            priority: 'high',
            icon: '🏪',
            timeAgo: '2天前'
          },
          {
            id: '2',
            title: '处理订单 #ORD20240717001',
            description: '小明便利店 - ¥3,200',
            priority: 'medium',
            icon: '📋',
            timeAgo: '5小时前'
          },
          {
            id: '3',
            title: '新客户资料录入',
            description: '福田区3家新开便利店信息待录入',
            priority: 'low',
            icon: '📝',
            timeAgo: '1天前'
          }
        ]
      });
    }
  },

  async loadNotifications() {
    try {
      const res = await app.request({
        url: '/notifications/recent',
        method: 'GET'
      });

      if (res.success) {
        this.setData({
          notifications: res.data.notifications || []
        });
      }
    } catch (error) {
      console.error('加载通知失败:', error);
      // 使用模拟数据
      this.setData({
        notifications: [
          {
            id: '1',
            title: '订单确认提醒',
            type: 'order',
            icon: '📦',
            timeAgo: '10分钟前'
          },
          {
            id: '2',
            title: '新产品上架通知',
            type: 'product',
            icon: '🆕',
            timeAgo: '2小时前'
          }
        ]
      });
    }
  },

  async loadTodaySchedule() {
    try {
      const res = await app.request({
        url: '/schedule/today',
        method: 'GET'
      });

      if (res.success) {
        this.setData({
          todaySchedule: res.data.schedule || []
        });
      }
    } catch (error) {
      console.error('加载今日安排失败:', error);
      // 使用模拟数据
      this.setData({
        todaySchedule: [
          {
            id: '1',
            time: '09:00',
            title: '拜访华联超市',
            description: '南山店 - 补货洽谈',
            status: 'completed',
            statusText: '已完成'
          },
          {
            id: '2',
            time: '14:00',
            title: '客户会议',
            description: '永辉超市 - 月度总结',
            status: 'pending',
            statusText: '待进行'
          },
          {
            id: '3',
            time: '16:30',
            title: '新店开发',
            description: '福田区市场调研',
            status: 'pending',
            statusText: '待进行'
          }
        ]
      });
    }
  },

  loadMockData() {
    // 当API调用失败时，加载模拟数据
    this.setData({
      todayStats: {
        plannedVisits: 8,
        completedVisits: 5,
        newOrders: 12,
        todayRevenue: '¥8,500'
      },
      performance: {
        currentMonth: '¥125,800',
        completion: 73,
        target: '¥180,000',
        ranking: '3'
      },
      businessData: {
        totalStores: 45,
        activeStores: 38,
        pendingOrders: 7,
        monthlyRevenue: '¥125,800'
      }
    });
  },

  // 快捷操作处理
  handleQuickAction(e) {
    const action = e.currentTarget.dataset.action;
    
    switch (action) {
      case 'scan_order':
        this.scanForOrder();
        break;
      case 'visit_checkin':
        this.visitCheckin();
        break;
      case 'add_store':
        wx.navigateTo({
          url: '/pages/stores/add/add'
        });
        break;
      case 'inventory':
        wx.navigateTo({
          url: '/pages/products/list/list?tab=inventory'
        });
        break;
    }
  },

  scanForOrder() {
    wx.scanCode({
      success: (res) => {
        console.log('扫码结果:', res);
        wx.navigateTo({
          url: `/pages/orders/create/create?code=${res.result}`
        });
      },
      fail: (error) => {
        console.error('扫码失败:', error);
        wx.showToast({
          title: '扫码失败',
          icon: 'none'
        });
      }
    });
  },

  visitCheckin() {
    wx.getLocation({
      type: 'gcj02',
      success: (res) => {
        console.log('获取位置成功:', res);
        wx.showToast({
          title: '打卡成功',
          icon: 'success'
        });
      },
      fail: (error) => {
        console.error('获取位置失败:', error);
        wx.showToast({
          title: '请允许位置权限',
          icon: 'none'
        });
      }
    });
  },

  // 待办事项点击
  handleTodoTap(e) {
    const todo = e.currentTarget.dataset.todo;
    
    if (todo.id === '1') {
      // 跳转到门店详情
      wx.navigateTo({
        url: '/pages/stores/detail/detail?id=store123'
      });
    } else if (todo.id === '2') {
      // 跳转到订单详情
      wx.navigateTo({
        url: '/pages/orders/detail/detail?id=order123'
      });
    }
  },

  // 页面跳转
  navigateToStores() {
    wx.switchTab({
      url: '/pages/stores/list/list'
    });
  },

  navigateToOrders() {
    wx.switchTab({
      url: '/pages/orders/list/list'
    });
  },

  goToLogin() {
    wx.navigateTo({
      url: '/pages/login/login'
    });
  },

  onPullDownRefresh() {
    this.loadDashboardData().finally(() => {
      wx.stopPullDownRefresh();
    });
  }
});