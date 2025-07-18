const app = getApp();

Page({
  data: {
    stores: [],
    storeStats: {
      total: 0,
      active: 0,
      potential: 0
    },
    activeTab: 'all',
    searchText: '',
    loading: true
  },

  onLoad(options) {
    this.loadStores();
  },

  onShow() {
    this.loadStores();
  },

  async loadStores() {
    wx.showLoading({ title: '加载中...' });
    
    try {
      const params = {
        page: 1,
        limit: 50
      };
      
      if (this.data.activeTab !== 'all') {
        params.businessStatus = this.data.activeTab === 'active' ? '活跃客户' : '潜在客户';
      }
      
      if (this.data.searchText) {
        params.search = this.data.searchText;
      }

      const res = await app.request({
        url: '/stores',
        method: 'GET',
        data: params
      });

      if (res.success) {
        const stores = res.data.stores.map(store => {
          const statusMap = {
            '活跃客户': 'active',
            '潜在客户': 'potential',
            '流失客户': 'inactive'
          };
          
          return {
            ...store,
            statusClass: statusMap[store.businessStatus] || 'potential'
          };
        });
        
        this.setData({
          stores: stores || [],
          storeStats: {
            total: res.data.total || 0,
            active: res.data.stats?.active || 0,
            potential: res.data.stats?.potential || 0
          }
        });
      } else {
        app.showError(res.message || '加载失败');
      }
    } catch (error) {
      console.error('加载门店列表失败:', error);
      app.showError('网络错误，请稍后重试');
    } finally {
      wx.hideLoading();
      this.setData({ loading: false });
    }
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ activeTab: tab });
    this.loadStores();
  },

  onSearchInput(e) {
    this.setData({ searchText: e.detail.value });
  },

  onSearch() {
    this.loadStores();
  },

  navigateToDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/stores/detail/detail?id=${id}`
    });
  },

  navigateToAdd() {
    wx.navigateTo({
      url: '/pages/stores/add/add'
    });
  },

  visitStore(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/stores/visit/visit?id=${id}`
    });
  },

  createOrder(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/orders/create/create?storeId=${id}`
    });
  },

  onPullDownRefresh() {
    this.loadStores().finally(() => {
      wx.stopPullDownRefresh();
    });
  }
})