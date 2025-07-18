const app = getApp();

Page({
  data: {
    orders: [],
    orderStats: {
      total: 0,
      pending: 0,
      confirmed: 0,
      shipped: 0,
      totalAmount: '￥0'
    },
    activeTab: 'all',
    loading: true
  },

  onLoad(options) {
    this.loadOrders();
  },

  onShow() {
    this.loadOrders();
  },

  async loadOrders() {
    wx.showLoading({ title: '加载中...' });
    
    try {
      const params = {
        page: 1,
        limit: 50
      };
      
      if (this.data.activeTab !== 'all') {
        const statusMap = {
          'pending': '待确认',
          'confirmed': '已确认', 
          'shipped': '已发货'
        };
        params.status = statusMap[this.data.activeTab];
      }

      const res = await app.request({
        url: '/orders',
        method: 'GET',
        data: params
      });

      if (res.success) {
        const orders = res.data.orders.map(order => {
          const statusMap = {
            '待确认': 'pending',
            '已确认': 'confirmed',
            '已发货': 'shipped', 
            '已完成': 'completed',
            '已取消': 'cancelled'
          };
          
          return {
            ...order,
            createdAtFormatted: app.formatDate(new Date(order.createdAt), 'MM-DD HH:mm'),
            statusClass: statusMap[order.orderStatus] || 'pending'
          };
        });

        this.setData({
          orders: orders || [],
          orderStats: {
            total: res.data.total || 0,
            pending: res.data.stats?.pending || 0,
            confirmed: res.data.stats?.confirmed || 0,
            shipped: res.data.stats?.shipped || 0,
            totalAmount: app.formatMoney(res.data.stats?.totalAmount || 0)
          }
        });
      } else {
        app.showError(res.message || '加载失败');
      }
    } catch (error) {
      console.error('加载订单列表失败:', error);
      app.showError('网络错误，请稍后重试');
    } finally {
      wx.hideLoading();
      this.setData({ loading: false });
    }
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ activeTab: tab });
    this.loadOrders();
  },

  navigateToDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/orders/detail/detail?id=${id}`
    });
  },

  navigateToCreate() {
    wx.navigateTo({
      url: '/pages/orders/create/create'
    });
  },

  async confirmOrder(e) {
    const id = e.currentTarget.dataset.id;
    
    try {
      wx.showLoading({ title: '处理中...' });
      
      const res = await app.request({
        url: `/orders/${id}/confirm`,
        method: 'PUT'
      });

      if (res.success) {
        wx.showToast({
          title: '订单已确认',
          icon: 'success'
        });
        this.loadOrders();
      } else {
        app.showError(res.message || '确认失败');
      }
    } catch (error) {
      console.error('确认订单失败:', error);
      app.showError('操作失败，请重试');
    } finally {
      wx.hideLoading();
    }
  },

  async rejectOrder(e) {
    const id = e.currentTarget.dataset.id;
    
    const that = this;
    wx.showModal({
      title: '确认拒绝',
      content: '确定要拒绝这个订单吗？',
      async success(res) {
        if (res.confirm) {
          try {
            wx.showLoading({ title: '处理中...' });
            
            const result = await app.request({
              url: `/orders/${id}/reject`,
              method: 'PUT'
            });

            if (result.success) {
              wx.showToast({
                title: '订单已拒绝',
                icon: 'success'
              });
              that.loadOrders();
            } else {
              app.showError(result.message || '拒绝失败');
            }
          } catch (error) {
            console.error('拒绝订单失败:', error);
            app.showError('操作失败，请重试');
          } finally {
            wx.hideLoading();
          }
        }
      }
    });
  },

  onPullDownRefresh() {
    this.loadOrders().finally(() => {
      wx.stopPullDownRefresh();
    });
  }
})