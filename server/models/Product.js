const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  productCode: {
    type: String,
    unique: true,
    required: true
  },
  productName: {
    type: String,
    required: true,
    trim: true
  },
  brand: {
    type: String,
    required: true
  },
  category: {
    primary: { type: String, required: true },
    secondary: String,
    tertiary: String
  },
  specifications: {
    unit: { type: String, required: true },
    netWeight: String,
    grossWeight: String,
    packageSize: String,
    shelfLife: Number
  },
  pricing: {
    wholesalePrice: { type: Number, required: true },
    retailPrice: { type: Number, required: true },
    promotionPrice: Number,
    minOrderQty: { type: Number, default: 1 },
    priceUnit: String
  },
  inventory: {
    totalStock: { type: Number, default: 0 },
    availableStock: { type: Number, default: 0 },
    reservedStock: { type: Number, default: 0 },
    safetyStock: { type: Number, default: 0 },
    warehouse: String
  },
  productInfo: {
    description: String,
    images: [String],
    barcode: String,
    manufacturer: String,
    origin: String,
    certifications: [String]
  },
  salesData: {
    totalSold: { type: Number, default: 0 },
    monthlyTarget: { type: Number, default: 0 },
    currentMonthSales: { type: Number, default: 0 },
    profitMargin: Number
  },
  promotion: {
    isOnPromotion: { type: Boolean, default: false },
    promotionType: String,
    promotionDetails: String,
    startDate: Date,
    endDate: Date,
    discountRate: Number
  },
  regions: [String],
  tags: [String],
  isActive: {
    type: Boolean,
    default: true
  },
  priority: {
    type: String,
    enum: ['高', '中', '低'],
    default: '中'
  }
}, {
  timestamps: true
});

productSchema.index({ 'category.primary': 1, 'brand': 1 });
productSchema.index({ 'productCode': 1 });
productSchema.index({ 'isActive': 1, 'priority': 1 });

module.exports = mongoose.model('Product', productSchema);