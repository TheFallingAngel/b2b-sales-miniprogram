const app = getApp();

Page({
  data: {
    summary: {
      totalRevenue: '￥0',
      totalOrders: 0,
      activeStores: 0,
      revenueTrend: 0,
      orderTrend: 0,
      storeTrend: 0
    },
    timeRange: 'month',
    storeRanking: [],
    topProducts: [],
    loading: true
  },

  onLoad(options) {
    this.loadAnalyticsData();
  },

  onShow() {
    this.loadAnalyticsData();
  },

  async loadAnalyticsData() {
    wx.showLoading({ title: '加载中...' });
    
    try {
      await Promise.all([
        this.loadSummaryData(),
        this.loadStoreRanking(),
        this.loadTopProducts(),
        this.loadSalesChart()
      ]);
    } catch (error) {
      console.error('加载数据分析失败:', error);
      app.showError('加载数据失败');
    } finally {
      wx.hideLoading();
      this.setData({ loading: false });
    }
  },

  async loadSummaryData() {
    try {
      const res = await app.request({
        url: '/analytics/summary',
        method: 'GET',
        data: { timeRange: this.data.timeRange }
      });

      if (res.success) {
        this.setData({
          summary: {
            totalRevenue: app.formatMoney(res.data.totalRevenue),
            totalOrders: res.data.totalOrders || 0,
            activeStores: res.data.activeStores || 0,
            revenueTrend: Math.round(res.data.revenueTrend || 0),
            orderTrend: Math.round(res.data.orderTrend || 0),
            storeTrend: Math.round(res.data.storeTrend || 0)
          }
        });
      }
    } catch (error) {
      console.error('加载汇总数据失败:', error);
    }
  },

  async loadStoreRanking() {
    try {
      const res = await app.request({
        url: '/analytics/stores/ranking',
        method: 'GET',
        data: { 
          timeRange: this.data.timeRange,
          limit: 10
        }
      });

      if (res.success) {
        const ranking = res.data.ranking.map(item => ({
          ...item,
          totalAmount: app.formatMoney(item.totalAmount)
        }));
        this.setData({ storeRanking: ranking });
      }
    } catch (error) {
      console.error('加载门店排行失败:', error);
    }
  },

  async loadTopProducts() {
    try {
      const res = await app.request({
        url: '/analytics/products/top',
        method: 'GET',
        data: { 
          timeRange: this.data.timeRange,
          limit: 10
        }
      });

      if (res.success) {
        const products = res.data.products.map(item => ({
          ...item,
          salesAmount: app.formatMoney(item.salesAmount)
        }));
        this.setData({ topProducts: products });
      }
    } catch (error) {
      console.error('加载热销产品失败:', error);
    }
  },

  async loadSalesChart() {
    try {
      const res = await app.request({
        url: '/analytics/sales/trend',
        method: 'GET',
        data: { timeRange: this.data.timeRange }
      });

      if (res.success) {
        this.drawSalesChart(res.data.chartData);
      }
    } catch (error) {
      console.error('加载销售趋势失败:', error);
    }
  },

  drawSalesChart(chartData) {
    const ctx = wx.createCanvasContext('salesChart');
    const canvasWidth = 350;
    const canvasHeight = 200;
    const padding = 30;
    
    // 清除画布
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    
    if (!chartData || chartData.length === 0) {
      ctx.setFontSize(16);
      ctx.setFillStyle('#999');
      ctx.fillText('暂无数据', canvasWidth / 2 - 30, canvasHeight / 2);
      ctx.draw();
      return;
    }

    // 计算最大值和数据点位置
    const maxValue = Math.max(...chartData.map(item => item.value));
    const stepX = (canvasWidth - padding * 2) / (chartData.length - 1);
    const stepY = (canvasHeight - padding * 2) / maxValue;

    // 绘制网格线
    ctx.setStrokeStyle('#f0f0f0');
    ctx.setLineWidth(1);
    for (let i = 0; i <= 5; i++) {
      const y = padding + (canvasHeight - padding * 2) * i / 5;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(canvasWidth - padding, y);
      ctx.stroke();
    }

    // 绘制折线
    ctx.setStrokeStyle('#2E7CE8');
    ctx.setLineWidth(2);
    ctx.beginPath();
    
    chartData.forEach((item, index) => {
      const x = padding + index * stepX;
      const y = canvasHeight - padding - item.value * stepY;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
      
      // 绘制数据点
      ctx.setFillStyle('#2E7CE8');
      ctx.fillRect(x - 2, y - 2, 4, 4);
    });
    
    ctx.stroke();
    
    // 绘制标签
    ctx.setFontSize(12);
    ctx.setFillStyle('#666');
    chartData.forEach((item, index) => {
      const x = padding + index * stepX;
      ctx.fillText(item.label, x - 15, canvasHeight - 5);
    });
    
    ctx.draw();
  },

  switchTimeRange(e) {
    const range = e.currentTarget.dataset.range;
    this.setData({ timeRange: range });
    this.loadAnalyticsData();
  },

  exportSalesData() {
    wx.showToast({
      title: '导出功能开发中',
      icon: 'none'
    });
  },

  exportStoreData() {
    wx.showToast({
      title: '导出功能开发中',
      icon: 'none'
    });
  },

  exportProductData() {
    wx.showToast({
      title: '导出功能开发中',
      icon: 'none'
    });
  },

  onPullDownRefresh() {
    this.loadAnalyticsData().finally(() => {
      wx.stopPullDownRefresh();
    });
  }
})