const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true,
    required: true
  },
  orderType: {
    type: String,
    enum: ['代客下单', '门店自主下单', '补货订单'],
    required: true
  },
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true
  },
  salesRep: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    unitPrice: {
      type: Number,
      required: true
    },
    totalPrice: {
      type: Number,
      required: true
    },
    discount: {
      type: Number,
      default: 0
    },
    finalPrice: {
      type: Number,
      required: true
    }
  }],
  orderSummary: {
    subtotal: { type: Number, required: true },
    totalDiscount: { type: Number, default: 0 },
    deliveryFee: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true }
  },
  paymentInfo: {
    paymentMethod: {
      type: String,
      enum: ['现金', '银行转账', '支付宝', '微信支付', '赊账'],
      required: true
    },
    paymentStatus: {
      type: String,
      enum: ['待付款', '已付款', '部分付款', '已退款'],
      default: '待付款'
    },
    paidAmount: { type: Number, default: 0 },
    paymentDate: Date,
    creditDays: { type: Number, default: 0 }
  },
  deliveryInfo: {
    deliveryMethod: {
      type: String,
      enum: ['送货上门', '门店自提', '第三方物流'],
      required: true
    },
    plannedDeliveryDate: Date,
    actualDeliveryDate: Date,
    deliveryAddress: String,
    deliveryNotes: String
  },
  orderStatus: {
    type: String,
    enum: ['待确认', '已确认', '配货中', '配送中', '已送达', '已完成', '已取消'],
    default: '待确认'
  },
  statusHistory: [{
    status: String,
    timestamp: { type: Date, default: Date.now },
    notes: String,
    operator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],
  notes: String,
  attachments: [String]
}, {
  timestamps: true
});

orderSchema.pre('save', function(next) {
  if (this.isNew && !this.orderNumber) {
    const timestamp = Date.now().toString();
    this.orderNumber = `ORD${timestamp.slice(-8)}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
  }
  next();
});

orderSchema.index({ 'store': 1, 'createdAt': -1 });
orderSchema.index({ 'salesRep': 1, 'createdAt': -1 });
orderSchema.index({ 'orderStatus': 1 });
orderSchema.index({ 'orderNumber': 1 });

module.exports = mongoose.model('Order', orderSchema);