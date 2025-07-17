const app = getApp();

Page({
  data: {
    products: [],
    productStats: {
      total: 0,
      categories: 0,
      lowStock: 0
    },
    categoryList: [
      { name: '全部分类', value: 'all' }
    ],
    categoryIndex: 0,
    searchText: '',
    loading: true
  },

  onLoad(options) {
    this.loadCategories();
    this.loadProducts();
  },

  onShow() {
    this.loadProducts();
  },

  async loadCategories() {
    try {
      const res = await app.request({
        url: '/products/categories',
        method: 'GET'
      });

      if (res.success) {
        const categories = [{ name: '全部分类', value: 'all' }];
        res.data.categories.forEach(cat => {
          categories.push({ name: cat, value: cat });
        });
        this.setData({ categoryList: categories });
      }
    } catch (error) {
      console.error('加载分类失败:', error);
    }
  },

  async loadProducts() {
    wx.showLoading({ title: '加载中...' });
    
    try {
      const params = {
        page: 1,
        limit: 50
      };
      
      const selectedCategory = this.data.categoryList[this.data.categoryIndex];
      if (selectedCategory.value !== 'all') {
        params.category = selectedCategory.value;
      }
      
      if (this.data.searchText) {
        params.search = this.data.searchText;
      }

      const res = await app.request({
        url: '/products',
        method: 'GET',
        data: params
      });

      if (res.success) {
        this.setData({
          products: res.data.products || [],
          productStats: {
            total: res.data.total || 0,
            categories: res.data.stats?.categories || 0,
            lowStock: res.data.stats?.lowStock || 0
          }
        });
      } else {
        app.showError(res.message || '加载失败');
      }
    } catch (error) {
      console.error('加载商品列表失败:', error);
      app.showError('网络错误，请稍后重试');
    } finally {
      wx.hideLoading();
      this.setData({ loading: false });
    }
  },

  onCategoryChange(e) {
    this.setData({ categoryIndex: parseInt(e.detail.value) });
    this.loadProducts();
  },

  onSearchInput(e) {
    this.setData({ searchText: e.detail.value });
  },

  onSearch() {
    this.loadProducts();
  },

  navigateToDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/products/detail/detail?id=${id}`
    });
  },

  addToCart(e) {
    const product = e.currentTarget.dataset.product;
    wx.showToast({
      title: '已加入购物车',
      icon: 'success'
    });
  },

  onPullDownRefresh() {
    this.loadProducts().finally(() => {
      wx.stopPullDownRefresh();
    });
  }
})