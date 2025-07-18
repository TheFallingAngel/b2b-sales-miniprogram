const app = getApp();

Page({
  data: {
    formData: {
      storeName: '',
      owner: {
        name: '',
        phone: '',
        idCard: '',
        wechat: ''
      },
      address: {
        province: '',
        city: '',
        district: '',
        street: '',
        coordinates: {
          longitude: null,
          latitude: null
        }
      },
      storeInfo: {
        storeType: '',
        businessHours: {
          open: '',
          close: ''
        },
        storeSize: '',
        monthlyRevenue: ''
      }
    },
    
    // 选择器数据
    storeTypes: ['超市', '便利店', '小卖部', '餐饮店', '其他'],
    storeTypeIndex: -1,
    
    storeSizes: ['小型(<50平)', '中型(50-200平)', '大型(>200平)'],
    storeSizeIndex: -1,
    
    revenueRanges: ['<1万', '1-5万', '5-10万', '10-20万', '>20万'],
    revenueIndex: -1,
    
    // 地区选择
    region: [],
    regionText: '',
    
    // 时间选择
    openTime: '',
    closeTime: '',
    
    // 定位
    locationText: '点击获取位置',
    
    // 表单状态
    canSubmit: false,
    submitting: false
  },

  onLoad(options) {
    // 如果从门店列表跳转过来，可能携带一些预填信息
    if (options.presetData) {
      try {
        const presetData = JSON.parse(decodeURIComponent(options.presetData));
        this.setData({
          formData: { ...this.data.formData, ...presetData }
        });
      } catch (error) {
        console.error('预设数据解析失败:', error);
      }
    }
  },

  // 输入框变化处理
  onInputChange(e) {
    const { field } = e.currentTarget.dataset;
    const value = e.detail.value;
    
    const updateData = {};
    if (field.includes('.')) {
      // 处理嵌套字段，如 owner.name
      const keys = field.split('.');
      let current = updateData;
      let formData = JSON.parse(JSON.stringify(this.data.formData));
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[`formData.${keys.slice(0, i + 1).join('.')}`]) {
          current[`formData.${keys.slice(0, i + 1).join('.')}`] = {};
        }
        current = current[`formData.${keys.slice(0, i + 1).join('.')}`];
      }
      
      updateData[`formData.${field}`] = value;
    } else {
      updateData[`formData.${field}`] = value;
    }
    
    this.setData(updateData, () => {
      this.checkCanSubmit();
    });
  },

  // 选择器变化处理
  onPickerChange(e) {
    const { field } = e.currentTarget.dataset;
    const index = parseInt(e.detail.value);
    
    const updateData = {};
    
    switch (field) {
      case 'storeType':
        updateData.storeTypeIndex = index;
        updateData['formData.storeInfo.storeType'] = this.data.storeTypes[index];
        break;
      case 'storeSize':
        updateData.storeSizeIndex = index;
        updateData['formData.storeInfo.storeSize'] = this.data.storeSizes[index];
        break;
      case 'monthlyRevenue':
        updateData.revenueIndex = index;
        updateData['formData.storeInfo.monthlyRevenue'] = this.data.revenueRanges[index];
        break;
    }
    
    this.setData(updateData, () => {
      this.checkCanSubmit();
    });
  },

  // 地区选择处理
  onRegionChange(e) {
    const region = e.detail.value;
    const regionText = region.join(' ');
    
    this.setData({
      region,
      regionText,
      'formData.address.province': region[0] || '',
      'formData.address.city': region[1] || '',
      'formData.address.district': region[2] || ''
    }, () => {
      this.checkCanSubmit();
    });
  },

  // 时间选择处理
  onTimeChange(e) {
    const { field } = e.currentTarget.dataset;
    const time = e.detail.value;
    
    const updateData = {};
    if (field === 'open') {
      updateData.openTime = time;
      updateData['formData.storeInfo.businessHours.open'] = time;
    } else if (field === 'close') {
      updateData.closeTime = time;
      updateData['formData.storeInfo.businessHours.close'] = time;
    }
    
    this.setData(updateData);
  },

  // 获取定位
  getLocation() {
    wx.getLocation({
      type: 'gcj02',
      success: (res) => {
        this.setData({
          'formData.address.coordinates.longitude': res.longitude,
          'formData.address.coordinates.latitude': res.latitude,
          locationText: '定位成功'
        });
        
        wx.showToast({
          title: '定位成功',
          icon: 'success'
        });
      },
      fail: (error) => {
        console.error('获取定位失败:', error);
        wx.showToast({
          title: '定位失败，请检查权限',
          icon: 'none'
        });
      }
    });
  },

  // 检查是否可以提交
  checkCanSubmit() {
    const { formData } = this.data;
    
    const required = [
      formData.storeName,
      formData.owner.name,
      formData.owner.phone,
      formData.address.province,
      formData.address.city,
      formData.address.district,
      formData.address.street,
      formData.storeInfo.storeType
    ];
    
    const canSubmit = required.every(field => field && field.trim().length > 0);
    
    // 验证手机号格式
    const phoneValid = /^1[3-9]\d{9}$/.test(formData.owner.phone);
    
    this.setData({
      canSubmit: canSubmit && phoneValid
    });
  },

  // 表单提交
  async handleSubmit(e) {
    if (!this.data.canSubmit || this.data.submitting) {
      return;
    }

    const { formData } = this.data;
    
    // 验证必填字段
    if (!formData.storeName.trim()) {
      wx.showToast({ title: '请输入门店名称', icon: 'none' });
      return;
    }
    
    if (!formData.owner.name.trim()) {
      wx.showToast({ title: '请输入负责人姓名', icon: 'none' });
      return;
    }
    
    if (!/^1[3-9]\d{9}$/.test(formData.owner.phone)) {
      wx.showToast({ title: '请输入正确的手机号', icon: 'none' });
      return;
    }
    
    if (!formData.address.street.trim()) {
      wx.showToast({ title: '请输入详细地址', icon: 'none' });
      return;
    }

    this.setData({ submitting: true });

    try {
      const res = await app.request({
        url: '/stores',
        method: 'POST',
        data: formData
      });

      if (res.success) {
        wx.showToast({
          title: '门店添加成功',
          icon: 'success'
        });

        // 延迟返回上一页
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      } else {
        wx.showToast({
          title: res.message || '添加失败',
          icon: 'none'
        });
      }
    } catch (error) {
      console.error('添加门店失败:', error);
      wx.showToast({
        title: '网络错误，请重试',
        icon: 'none'
      });
    } finally {
      this.setData({ submitting: false });
    }
  },

  // 重置表单
  resetForm() {
    this.setData({
      formData: {
        storeName: '',
        owner: {
          name: '',
          phone: '',
          idCard: '',
          wechat: ''
        },
        address: {
          province: '',
          city: '',
          district: '',
          street: '',
          coordinates: {
            longitude: null,
            latitude: null
          }
        },
        storeInfo: {
          storeType: '',
          businessHours: {
            open: '',
            close: ''
          },
          storeSize: '',
          monthlyRevenue: ''
        }
      },
      storeTypeIndex: -1,
      storeSizeIndex: -1,
      revenueIndex: -1,
      region: [],
      regionText: '',
      openTime: '',
      closeTime: '',
      locationText: '点击获取位置',
      canSubmit: false
    });
  }
});