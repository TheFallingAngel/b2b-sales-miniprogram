App({
  globalData: {
    userInfo: null,
    token: null,
    baseUrl: 'https://b2b-sales-miniprogram-production.up.railway.app/api',
    version: '1.0.0'
  },

  onLaunch() {
    console.log('B2B销售小程序启动');
    
    this.checkLoginStatus();
    this.initSystemInfo();
  },

  checkLoginStatus() {
    const token = wx.getStorageSync('token');
    const userInfo = wx.getStorageSync('userInfo');
    
    if (token && userInfo) {
      this.globalData.token = token;
      this.globalData.userInfo = userInfo;
      
      this.validateToken().then(valid => {
        if (!valid) {
          this.logout();
        }
      });
    } else {
      this.redirectToLogin();
    }
  },

  async validateToken() {
    try {
      const res = await this.request({
        url: '/auth/profile',
        method: 'GET'
      });
      
      if (res.success) {
        this.globalData.userInfo = res.data.user;
        wx.setStorageSync('userInfo', res.data.user);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Token验证失败:', error);
      return false;
    }
  },

  initSystemInfo() {
    wx.getSystemInfo({
      success: (res) => {
        this.globalData.systemInfo = res;
        
        const menuButton = wx.getMenuButtonBoundingClientRect();
        this.globalData.navBarHeight = menuButton.top + menuButton.height + 10;
      }
    });
  },

  request(options) {
    return new Promise((resolve, reject) => {
      const { url, method = 'GET', data = {}, showLoading = false } = options;
      
      if (showLoading) {
        wx.showLoading({ title: '加载中...' });
      }

      wx.request({
        url: this.globalData.baseUrl + url,
        method,
        data,
        header: {
          'Content-Type': 'application/json',
          'Authorization': this.globalData.token ? `Bearer ${this.globalData.token}` : ''
        },
        success: (res) => {
          if (showLoading) {
            wx.hideLoading();
          }

          if (res.statusCode === 200) {
            resolve(res.data);
          } else if (res.statusCode === 401) {
            this.logout();
            reject(new Error('未授权访问'));
          } else {
            const errorMsg = res.data?.message || '请求失败';
            this.showError(errorMsg);
            reject(new Error(errorMsg));
          }
        },
        fail: (error) => {
          if (showLoading) {
            wx.hideLoading();
          }
          
          this.showError('网络连接失败');
          reject(error);
        }
      });
    });
  },

  login(phone, password) {
    return this.request({
      url: '/auth/login',
      method: 'POST',
      data: { phone, password },
      showLoading: true
    }).then(res => {
      if (res.success) {
        this.globalData.token = res.data.token;
        this.globalData.userInfo = res.data.user;
        
        wx.setStorageSync('token', res.data.token);
        wx.setStorageSync('userInfo', res.data.user);
        
        return res.data;
      }
      throw new Error(res.message);
    });
  },

  logout() {
    this.globalData.token = null;
    this.globalData.userInfo = null;
    
    wx.removeStorageSync('token');
    wx.removeStorageSync('userInfo');
    
    this.redirectToLogin();
  },

  redirectToLogin() {
    const pages = getCurrentPages();
    const currentPage = pages[pages.length - 1];
    
    if (currentPage && currentPage.route !== 'pages/login/login') {
      wx.reLaunch({
        url: '/pages/login/login'
      });
    }
  },

  showError(message) {
    wx.showToast({
      title: message,
      icon: 'none',
      duration: 2000
    });
  },

  showSuccess(message) {
    wx.showToast({
      title: message,
      icon: 'success',
      duration: 1500
    });
  },

  formatMoney(amount) {
    if (!amount) return '¥0.00';
    return `¥${parseFloat(amount).toFixed(2)}`;
  },

  formatDate(date, format = 'YYYY-MM-DD') {
    if (!date) return '';
    
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hour = String(d.getHours()).padStart(2, '0');
    const minute = String(d.getMinutes()).padStart(2, '0');
    
    return format
      .replace('YYYY', year)
      .replace('MM', month)
      .replace('DD', day)
      .replace('HH', hour)
      .replace('mm', minute);
  },

  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
});