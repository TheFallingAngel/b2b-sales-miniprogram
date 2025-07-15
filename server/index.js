const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoose = require('mongoose');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const storeRoutes = require('./routes/stores');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const analyticsRoutes = require('./routes/analytics');
const customerRoutes = require('./routes/customers');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/b2b_sales', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, '数据库连接错误:'));
db.once('open', () => {
  console.log('✅ MongoDB 连接成功');
});

app.use('/api/auth', authRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/customers', customerRoutes);

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'B2B销售小程序API服务运行正常',
    version: '1.0.1',
    timestamp: new Date().toISOString()
  });
});

// 数据库初始化接口（仅用于生产环境首次部署）
app.post('/api/init-database', async (req, res) => {
  try {
    const User = require('./models/User');
    
    // 检查是否已初始化
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      return res.json({ success: false, message: '数据库已有数据，无需初始化' });
    }

    // 创建测试用户
    const testUser = new User({
      username: 'test_prod',
      phone: '13800138000', 
      password: '123456',
      realName: '生产测试用户',
      region: '深圳',
      role: '业务员',
      isActive: true
    });
    
    await testUser.save();
    
    res.json({ 
      success: true, 
      message: '数据库初始化成功',
      testAccount: { phone: '13800138000', password: '123456' }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '初始化失败', error: error.message });
  }
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: '服务器内部错误',
    message: process.env.NODE_ENV === 'development' ? err.message : '请联系技术支持'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 B2B销售小程序API服务启动成功，端口: ${PORT}`);
});

module.exports = app;