const app = getApp();

Page({
  data: {
    // 选中的门店
    selectedStore: null,
    
    // 订单商品列表
    orderItems: [],
    
    // 表单数据
    formData: {
      orderType: '',
      paymentMethod: '',
      deliveryMethod: '',
      plannedDeliveryDate: '',
      deliveryAddress: '',
      creditDays: 0,
      notes: ''
    },
    
    // 选择器数据
    orderTypes: ['代客下单', '门店自主下单', '补货订单'],
    orderTypeIndex: -1,
    
    paymentMethods: ['现金', '银行转账', '支付宝', '微信支付', '赊账'],
    paymentMethodIndex: -1,
    
    deliveryMethods: ['送货上门', '门店自提', '第三方物流'],
    deliveryMethodIndex: -1,
    
    // 订单汇总
    subtotal: 0,
    deliveryFee: 0,
    totalAmount: 0,
    totalQuantity: 0,
    
    // 弹窗显示
    showStoreModal: false,
    showProductModal: false,
    
    // 门店和商品列表
    storeList: [],
    productList: [],
    productSearchText: '',
    
    // 表单状态
    canSubmit: false,
    submitting: false,
    
    // 日期限制
    todayDate: ''
  },

  onLoad(options) {
    // 设置今天日期
    const today = new Date();
    const todayStr = today.getFullYear() + '-' + 
                     String(today.getMonth() + 1).padStart(2, '0') + '-' + 
                     String(today.getDate()).padStart(2, '0');
    this.setData({ todayDate: todayStr });
    
    // 如果传入了门店ID，直接选择该门店
    if (options.storeId) {
      this.loadStoreById(options.storeId);
    }
    
    // 加载门店列表
    this.loadStores();
  },

  // 根据ID加载门店信息
  async loadStoreById(storeId) {
    try {
      const res = await app.request({
        url: `/stores/${storeId}`,
        method: 'GET'
      });
      
      if (res.success) {
        this.setData({ 
          selectedStore: res.data.store 
        }, () => {
          this.checkCanSubmit();
        });
      }
    } catch (error) {
      console.error('加载门店信息失败:', error);
    }
  },

  // 加载门店列表
  async loadStores() {
    try {
      const res = await app.request({
        url: '/stores',
        method: 'GET',
        data: { limit: 100 }
      });
      
      if (res.success) {
        this.setData({ storeList: res.data.stores || [] });
      }
    } catch (error) {
      console.error('加载门店列表失败:', error);
    }
  },

  // 加载商品列表
  async loadProducts(search = '') {
    try {
      const res = await app.request({
        url: '/products',
        method: 'GET',
        data: { 
          limit: 50,
          search: search || undefined,
          inStock: true
        }
      });
      
      if (res.success) {
        this.setData({ productList: res.data.products || [] });
      }
    } catch (error) {
      console.error('加载商品列表失败:', error);
    }
  },

  // 选择门店
  selectStore() {
    this.setData({ showStoreModal: true });
  },

  // 从弹窗选择门店
  selectStoreFromModal(e) {
    const store = e.currentTarget.dataset.store;
    this.setData({ 
      selectedStore: store,
      showStoreModal: false 
    }, () => {
      this.checkCanSubmit();
    });
  },

  // 隐藏门店选择弹窗
  hideStoreModal() {
    this.setData({ showStoreModal: false });
  },

  // 添加商品
  addProduct() {
    this.loadProducts();
    this.setData({ showProductModal: true });
  },

  // 商品搜索
  onProductSearchInput(e) {
    const searchText = e.detail.value;
    this.setData({ productSearchText: searchText });
    
    // 防抖搜索
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.loadProducts(searchText);
    }, 500);
  },

  // 从弹窗选择商品
  selectProductFromModal(e) {
    const product = e.currentTarget.dataset.product;
    
    // 检查是否已经添加过该商品
    const existingIndex = this.data.orderItems.findIndex(item => 
      item.product._id === product._id
    );
    
    if (existingIndex >= 0) {
      wx.showToast({
        title: '该商品已添加',
        icon: 'none'
      });
      return;
    }
    
    // 添加商品到订单
    const orderItem = {
      id: Date.now().toString(),
      product: product,
      quantity: product.pricing.minOrderQty || 1,
      unitPrice: product.pricing.wholesalePrice,
      totalPrice: (product.pricing.minOrderQty || 1) * product.pricing.wholesalePrice
    };
    
    const orderItems = [...this.data.orderItems, orderItem];
    this.setData({ 
      orderItems,
      showProductModal: false 
    }, () => {
      this.calculateTotal();
      this.checkCanSubmit();
    });
  },

  // 隐藏商品选择弹窗
  hideProductModal() {
    this.setData({ showProductModal: false });
  },

  // 修改商品数量
  changeQuantity(e) {
    const { index, action } = e.currentTarget.dataset;
    const orderItems = [...this.data.orderItems];
    const item = orderItems[index];
    
    if (action === 'plus') {
      item.quantity += 1;
    } else if (action === 'minus' && item.quantity > 1) {
      item.quantity -= 1;
    }
    
    item.totalPrice = item.quantity * item.unitPrice;
    
    this.setData({ orderItems }, () => {
      this.calculateTotal();
    });
  },

  // 输入数量
  onQuantityInput(e) {
    const index = e.currentTarget.dataset.index;
    const quantity = parseInt(e.detail.value) || 1;
    const orderItems = [...this.data.orderItems];
    const item = orderItems[index];
    
    if (quantity < 1) {
      wx.showToast({
        title: '数量不能小于1',
        icon: 'none'
      });
      return;
    }
    
    if (quantity > item.product.inventory.availableStock) {
      wx.showToast({
        title: '数量不能超过库存',
        icon: 'none'
      });
      return;
    }
    
    item.quantity = quantity;
    item.totalPrice = item.quantity * item.unitPrice;
    
    this.setData({ orderItems }, () => {
      this.calculateTotal();
    });
  },

  // 移除商品
  removeItem(e) {
    const index = e.currentTarget.dataset.index;
    const orderItems = [...this.data.orderItems];
    orderItems.splice(index, 1);
    
    this.setData({ orderItems }, () => {
      this.calculateTotal();
      this.checkCanSubmit();
    });
  },

  // 计算订单总额
  calculateTotal() {
    const { orderItems } = this.data;
    
    let subtotal = 0;
    let totalQuantity = 0;
    
    orderItems.forEach(item => {
      subtotal += item.totalPrice;
      totalQuantity += item.quantity;
    });
    
    // 配送费计算逻辑（这里简化处理）
    const deliveryFee = subtotal >= 200 ? 0 : 10;
    const totalAmount = subtotal + deliveryFee;
    
    this.setData({
      subtotal: subtotal.toFixed(2),
      totalQuantity,
      deliveryFee: deliveryFee.toFixed(2),
      totalAmount: totalAmount.toFixed(2)
    });
  },

  // 订单类型选择
  onOrderTypeChange(e) {
    const index = parseInt(e.detail.value);
    this.setData({
      orderTypeIndex: index,
      'formData.orderType': this.data.orderTypes[index]
    }, () => {
      this.checkCanSubmit();
    });
  },

  // 支付方式选择
  onPaymentMethodChange(e) {
    const index = parseInt(e.detail.value);
    this.setData({
      paymentMethodIndex: index,
      'formData.paymentMethod': this.data.paymentMethods[index]
    }, () => {
      this.checkCanSubmit();
    });
  },

  // 配送方式选择
  onDeliveryMethodChange(e) {
    const index = parseInt(e.detail.value);
    this.setData({
      deliveryMethodIndex: index,
      'formData.deliveryMethod': this.data.deliveryMethods[index]
    }, () => {
      this.checkCanSubmit();
    });
  },

  // 配送地址输入
  onDeliveryAddressInput(e) {
    this.setData({
      'formData.deliveryAddress': e.detail.value
    });
  },

  // 配送日期选择
  onDeliveryDateChange(e) {
    this.setData({
      'formData.plannedDeliveryDate': e.detail.value
    });
  },

  // 账期天数输入
  onCreditDaysInput(e) {
    this.setData({
      'formData.creditDays': parseInt(e.detail.value) || 0
    });
  },

  // 备注输入
  onNotesInput(e) {
    this.setData({
      'formData.notes': e.detail.value
    });
  },

  // 检查是否可以提交
  checkCanSubmit() {
    const { selectedStore, orderItems, formData } = this.data;
    
    const hasStore = !!selectedStore;
    const hasProducts = orderItems.length > 0;
    const hasOrderType = !!formData.orderType;
    const hasPaymentMethod = !!formData.paymentMethod;
    const hasDeliveryMethod = !!formData.deliveryMethod;
    
    // 如果选择送货上门，需要配送地址
    const needDeliveryAddress = formData.deliveryMethod === '送货上门';
    const hasDeliveryAddress = needDeliveryAddress ? !!formData.deliveryAddress : true;
    
    const canSubmit = hasStore && hasProducts && hasOrderType && 
                     hasPaymentMethod && hasDeliveryMethod && hasDeliveryAddress;
    
    this.setData({ canSubmit });
  },

  // 提交订单
  async submitOrder() {
    if (!this.data.canSubmit || this.data.submitting) {
      return;
    }

    const { selectedStore, orderItems, formData } = this.data;

    // 构建订单数据
    const orderData = {
      orderType: formData.orderType,
      store: selectedStore._id,
      items: orderItems.map(item => ({
        product: item.product._id,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: 0
      })),
      paymentMethod: formData.paymentMethod,
      deliveryMethod: formData.deliveryMethod,
      plannedDeliveryDate: formData.plannedDeliveryDate || undefined,
      deliveryAddress: formData.deliveryAddress || undefined,
      notes: formData.notes || undefined,
      creditDays: formData.creditDays || 0
    };

    this.setData({ submitting: true });

    try {
      const res = await app.request({
        url: '/orders',
        method: 'POST',
        data: orderData
      });

      if (res.success) {
        wx.showToast({
          title: '订单创建成功',
          icon: 'success'
        });

        // 延迟跳转到订单详情
        setTimeout(() => {
          wx.redirectTo({
            url: `/pages/orders/detail/detail?id=${res.data.order._id}`
          });
        }, 1500);
      } else {
        wx.showToast({
          title: res.message || '创建失败',
          icon: 'none'
        });
      }
    } catch (error) {
      console.error('创建订单失败:', error);
      wx.showToast({
        title: '网络错误，请重试',
        icon: 'none'
      });
    } finally {
      this.setData({ submitting: false });
    }
  },

  // 阻止事件冒泡
  stopPropagation() {
    // 空函数，用于阻止事件冒泡
  }
});