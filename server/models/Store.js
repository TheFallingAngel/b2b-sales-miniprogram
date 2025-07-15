const mongoose = require('mongoose');

const storeSchema = new mongoose.Schema({
  storeName: {
    type: String,
    required: true,
    trim: true
  },
  storeCode: {
    type: String,
    unique: true,
    required: true
  },
  owner: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    idCard: { type: String },
    wechat: { type: String }
  },
  address: {
    province: { type: String, required: true },
    city: { type: String, required: true },
    district: { type: String, required: true },
    street: { type: String, required: true },
    coordinates: {
      longitude: Number,
      latitude: Number
    }
  },
  storeInfo: {
    storeType: {
      type: String,
      enum: ['超市', '便利店', '小卖部', '餐饮店', '其他'],
      required: true
    },
    businessHours: {
      open: String,
      close: String
    },
    storeSize: {
      type: String,
      enum: ['小型(<50平)', '中型(50-200平)', '大型(>200平)']
    },
    monthlyRevenue: {
      type: String,
      enum: ['<1万', '1-5万', '5-10万', '10-20万', '>20万']
    }
  },
  businessStatus: {
    type: String,
    enum: ['潜在客户', '意向客户', '合作客户', '流失客户'],
    default: '潜在客户'
  },
  salesRep: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  creditInfo: {
    creditLimit: { type: Number, default: 0 },
    usedCredit: { type: Number, default: 0 },
    paymentTerms: { type: String, default: '现金' }
  },
  visitHistory: [{
    date: { type: Date, default: Date.now },
    purpose: String,
    notes: String,
    photos: [String],
    salesRep: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],
  orderHistory: {
    totalOrders: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
    lastOrderDate: Date,
    avgOrderValue: { type: Number, default: 0 }
  },
  tags: [String],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

storeSchema.index({ 'address.city': 1, 'salesRep': 1 });
storeSchema.index({ 'businessStatus': 1 });
storeSchema.index({ 'storeCode': 1 });

module.exports = mongoose.model('Store', storeSchema);