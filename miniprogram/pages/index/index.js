const app = getApp();

Page({
  data: {
    userInfo: {},
    performance: {
      currentMonth: '¥0',
      completion: 0
    },
    storeStats: {
      total: 0,
      newThisMonth: 0
    },
    orderStats: {
      monthlyOrders: 0,
      monthlyAmount: '¥0',
      avgOrderValue: '¥0',
      trend: 0
    },
    todoList: [],
    activities: [],
    loading: true
  },

  onLoad() {
    this.setData({
      userInfo: app.globalData.userInfo || {}
    });
  },

  onShow() {
    if (app.globalData.userInfo) {
      this.loadDashboardData();
    }
  },

  async loadDashboardData() {
    wx.showLoading({ title: '加载中...' });
    
    try {
      await Promise.all([
        this.loadUserPerformance(),
        this.loadStoreStats(),
        this.loadOrderStats(),
        this.loadTodoList(),
        this.loadRecentActivities()
      ]);
    } catch (error) {
      console.error('加载数据失败:', error);
      app.showError('加载数据失败');
    } finally {
      wx.hideLoading();
      this.setData({ loading: false });
    }
  },

  async loadUserPerformance() {
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
            completion: Math.round(performance.completion || 0)
          }
        });
      }
    } catch (error) {
      console.error('加载业绩数据失败:', error);
    }
  },

  async loadStoreStats() {
    try {
      const res = await app.request({
        url: '/stores/stats/summary',
        method: 'GET'
      });

      if (res.success) {
        const summary = res.data.summary;
        this.setData({
          storeStats: {
            total: summary.总门店数 || 0,
            newThisMonth: summary.新增门店 || 0
          }
        });
      }
    } catch (error) {
      console.error('加载门店统计失败:', error);
    }
  },

  async loadOrderStats() {
    try {
      const res = await app.request({
        url: '/orders/stats/summary',
        method: 'GET'
      });

      if (res.success) {
        const summary = res.data.summary;
        this.setData({
          orderStats: {
            monthlyOrders: summary.monthly.totalOrders || 0,
            monthlyAmount: app.formatMoney(summary.monthly.totalAmount),
            avgOrderValue: app.formatMoney(summary.monthly.avgOrderValue),
            trend: summary.trend || 0
          }
        });
      }
    } catch (error) {
      console.error('加载订单统计失败:', error);
    }
  },

  async loadTodoList() {
    try {
      const todoItems = [];
      
      const [storeRes, orderRes] = await Promise.all([
        app.request({
          url: '/stores?businessStatus=潜在客户&limit=5',
          method: 'GET'
        }),
        app.request({
          url: '/orders?status=待确认&limit=5',
          method: 'GET'
        })
      ]);

      if (storeRes.success && storeRes.data.stores.length > 0) {
        storeRes.data.stores.forEach(store => {
          const daysSinceLastVisit = this.getDaysSinceLastVisit(store.visitHistory);
          if (daysSinceLastVisit > 7) {
            todoItems.push({
              id: `visit_${store._id}`,
              title: `拜访 ${store.storeName}`,
              description: `已${daysSinceLastVisit}天未拜访`,
              priority: daysSinceLastVisit > 14 ? 'high' : 'medium',
              icon: 'icon-visit',
              timeAgo: `${daysSinceLastVisit}天前`,
              type: 'visit',
              data: store
            });
          }
        });
      }

      if (orderRes.success && orderRes.data.orders.length > 0) {
        orderRes.data.orders.forEach(order => {
          todoItems.push({
            id: `order_${order._id}`,
            title: `处理订单 ${order.orderNumber}`,
            description: `${order.store.storeName} - ${app.formatMoney(order.orderSummary.totalAmount)}`,
            priority: 'high',
            icon: 'icon-order',
            timeAgo: this.getTimeAgo(order.createdAt),
            type: 'order',
            data: order
          });
        });
      }

      this.setData({ todoList: todoItems.slice(0, 5) });
    } catch (error) {
      console.error('加载待办事项失败:', error);
    }
  },

  async loadRecentActivities() {
    try {
      const activities = [];
      
      const orderRes = await app.request({
        url: '/orders?limit=10',
        method: 'GET'
      });

      if (orderRes.success) {
        orderRes.data.orders.forEach(order => {
          activities.push({
            id: `order_${order._id}`,
            title: `${order.orderType} - ${order.store.storeName}`,
            description: `${app.formatMoney(order.orderSummary.totalAmount)} · ${order.orderStatus}`,
            timeAgo: this.getTimeAgo(order.createdAt),
            type: 'order'
          });
        });
      }

      this.setData({ 
        activities: activities.slice(0, 8).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      });
    } catch (error) {
      console.error('加载最近动态失败:', error);
    }
  },

  getDaysSinceLastVisit(visitHistory) {
    if (!visitHistory || visitHistory.length === 0) return 999;
    
    const lastVisit = visitHistory[visitHistory.length - 1];
    const daysDiff = Math.floor((Date.now() - new Date(lastVisit.date)) / (1000 * 60 * 60 * 24));
    return daysDiff;
  },

  getTimeAgo(dateString) {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return '刚刚';
    if (diffInHours < 24) return `${diffInHours}小时前`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}天前`;
    
    return app.formatDate(date, 'MM-DD');
  },

  handleTodoTap(e) {
    const todo = e.currentTarget.dataset.todo;
    
    switch (todo.type) {
      case 'visit':
        wx.navigateTo({
          url: `/pages/stores/detail/detail?id=${todo.data._id}`
        });
        break;
      case 'order':
        wx.navigateTo({
          url: `/pages/orders/detail/detail?id=${todo.data._id}`
        });
        break;
    }
  },

  navigateToAddStore() {
    wx.navigateTo({
      url: '/pages/stores/add/add'
    });
  },

  navigateToCreateOrder() {
    wx.navigateTo({
      url: '/pages/orders/create/create'
    });
  },

  navigateToStoreVisit() {
    wx.navigateTo({
      url: '/pages/stores/list/list?tab=visit'
    });
  },

  navigateToInventory() {
    wx.navigateTo({
      url: '/pages/products/list/list?tab=inventory'
    });
  },

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

  onPullDownRefresh() {
    this.loadDashboardData().finally(() => {
      wx.stopPullDownRefresh();
    });
  }
});