const app = getApp();

Page({
  data: {
    phone: '',
    password: '',
    loading: false,
    canSubmit: false,
    version: '1.0.0'
  },

  onLoad() {
    this.setData({
      version: app.globalData.version
    });
  },

  onPhoneInput(e) {
    this.setData({
      phone: e.detail.value
    });
    this.checkCanSubmit();
  },

  onPasswordInput(e) {
    this.setData({
      password: e.detail.value
    });
    this.checkCanSubmit();
  },

  checkCanSubmit() {
    const { phone, password } = this.data;
    const canSubmit = phone.length === 11 && password.length >= 6;
    this.setData({ canSubmit });
  },

  async handleLogin() {
    if (!this.data.canSubmit || this.data.loading) return;

    const { phone, password } = this.data;
    
    this.setData({ loading: true });

    try {
      const result = await app.login(phone, password);
      
      wx.showToast({
        title: '登录成功',
        icon: 'success'
      });

      // 登录成功后跳转到首页
      setTimeout(() => {
        wx.switchTab({
          url: '/pages/index/index'
        });
      }, 1000);

    } catch (error) {
      console.error('登录失败:', error);
      wx.showToast({
        title: error.message || '登录失败',
        icon: 'none'
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  // 快速填入测试账户
  fillTestAccount() {
    this.setData({
      phone: '13900000003',
      password: '123456'
    });
    this.checkCanSubmit();
  }
})