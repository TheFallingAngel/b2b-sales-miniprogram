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

mongoose.connect(process.env.MONGO_URL || process.env.MONGODB_URI || 'mongodb://localhost:27017/b2b_sales', {
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
    // 检查数据库连接状态
    if (mongoose.connection.readyState !== 1) {
      return res.status(500).json({ 
        success: false, 
        message: '数据库连接未就绪',
        connectionState: mongoose.connection.readyState 
      });
    }

    const User = require('./models/User');
    
    // 设置查询超时
    const userCount = await User.countDocuments().maxTimeMS(5000);
    console.log('当前用户数量:', userCount);
    
    if (userCount > 0) {
      return res.json({ 
        success: false, 
        message: `数据库已有${userCount}个用户，无需初始化` 
      });
    }

    console.log('开始创建测试用户...');
    
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
    
    const savedUser = await testUser.save();
    console.log('用户创建成功:', savedUser._id);
    
    res.json({ 
      success: true, 
      message: '数据库初始化成功',
      testAccount: { phone: '13800138000', password: '123456' },
      userId: savedUser._id
    });
  } catch (error) {
    console.error('初始化失败:', error);
    res.status(500).json({ 
      success: false, 
      message: '初始化失败', 
      error: error.message,
      errorName: error.name
    });
  }
});

// 创建完整测试数据接口
app.post('/api/create-test-data', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(500).json({ 
        success: false, 
        message: '数据库连接未就绪' 
      });
    }

    const User = require('./models/User');
    const Store = require('./models/Store');
    const Product = require('./models/Product');
    const Order = require('./models/Order');

    console.log('开始创建完整测试数据...');

    // 检查是否已有完整数据
    const existingUsers = await User.countDocuments();
    const existingProducts = await Product.countDocuments();
    const existingStores = await Store.countDocuments();
    
    if (existingUsers > 1 || existingProducts > 0 || existingStores > 0) {
      return res.json({
        success: false,
        message: '数据库已有测试数据，无需重复创建',
        existing: {
          users: existingUsers,
          products: existingProducts, 
          stores: existingStores
        }
      });
    }

    // 创建多个用户
    const users = [];
    
    // 管理员
    const admin = new User({
      username: 'admin',
      phone: '13900000001',
      password: '123456',
      realName: '系统管理员',
      region: '总部',
      role: '管理员',
      isActive: true
    });
    users.push(await admin.save());

    // 区域经理
    const manager = new User({
      username: 'manager_gz',
      phone: '13900000002',
      password: '123456',
      realName: '李经理',
      region: '广州',
      role: '区域经理',
      isActive: true
    });
    users.push(await manager.save());

    // 业务员
    const sales1 = new User({
      username: 'sales_001',
      phone: '13900000003',
      password: '123456',
      realName: '张业务',
      region: '深圳',
      role: '业务员',
      isActive: true
    });
    users.push(await sales1.save());

    const sales2 = new User({
      username: 'sales_002',
      phone: '13900000004',
      password: '123456',
      realName: '王业务',
      region: '广州',
      role: '业务员',
      isActive: true
    });
    users.push(await sales2.save());

    // 创建产品
    const products = [];
    const productData = [
      { productName: '可口可乐 330ml', category: '饮料', brand: '可口可乐', price: 3.5, unit: '瓶', stock: 1000, code: 'KKL001' },
      { productName: '百事可乐 330ml', category: '饮料', brand: '百事', price: 3.2, unit: '瓶', stock: 800, code: 'BSK001' },
      { productName: '康师傅方便面', category: '方便食品', brand: '康师傅', price: 4.2, unit: '包', stock: 500, code: 'KSF001' },
      { productName: '统一方便面', category: '方便食品', brand: '统一', price: 4.0, unit: '包', stock: 600, code: 'TY001' },
      { productName: '旺旺雪饼', category: '休闲食品', brand: '旺旺', price: 6.8, unit: '包', stock: 300, code: 'WW001' },
      { productName: '乐事薯片', category: '休闲食品', brand: '乐事', price: 8.5, unit: '包', stock: 400, code: 'LS001' },
      { productName: '雀巢咖啡', category: '饮品', brand: '雀巢', price: 12.0, unit: '盒', stock: 200, code: 'QC001' },
      { productName: '蒙牛纯牛奶', category: '乳制品', brand: '蒙牛', price: 15.8, unit: '盒', stock: 150, code: 'MN001' }
    ];

    for (const data of productData) {
      const product = new Product({
        productCode: data.code,
        productName: data.productName,
        brand: data.brand,
        category: {
          primary: data.category,
          secondary: data.category
        },
        specifications: {
          unit: data.unit,
          netWeight: '330ml',
          packageSize: '标准包装'
        },
        pricing: {
          wholesalePrice: data.price * 0.8,
          retailPrice: data.price,
          minOrderQty: 1
        },
        inventory: {
          totalStock: data.stock,
          availableStock: data.stock,
          safetyStock: 50
        },
        productInfo: {
          description: `优质${data.productName}，热销产品`,
          manufacturer: data.brand
        },
        isActive: true,
        priority: '中'
      });
      products.push(await product.save());
    }

    // 创建门店
    const stores = [];
    const storeData = [
      { storeName: '便利蜂-南山店', storeCode: 'ST001', ownerName: '张老板', ownerPhone: '13700000001', city: '深圳市', district: '南山区', street: '科技园南路123号', salesRep: sales1._id },
      { storeName: '7-11便利店', storeCode: 'ST002', ownerName: '李老板', ownerPhone: '13700000002', city: '深圳市', district: '福田区', street: '华强北路456号', salesRep: sales1._id },
      { storeName: '天虹超市', storeCode: 'ST003', ownerName: '王老板', ownerPhone: '13700000003', city: '广州市', district: '天河区', street: '珠江新城789号', salesRep: sales2._id },
      { storeName: '华润万家', storeCode: 'ST004', ownerName: '赵老板', ownerPhone: '13700000004', city: '广州市', district: '越秀区', street: '中山路101号', salesRep: sales2._id },
      { storeName: '美宜佳-罗湖店', storeCode: 'ST005', ownerName: '陈老板', ownerPhone: '13700000005', city: '深圳市', district: '罗湖区', street: '东门路202号', salesRep: sales1._id }
    ];

    for (const data of storeData) {
      const store = new Store({
        storeName: data.storeName,
        storeCode: data.storeCode,
        owner: {
          name: data.ownerName,
          phone: data.ownerPhone
        },
        address: {
          province: '广东省',
          city: data.city,
          district: data.district,
          street: data.street,
          coordinates: {
            longitude: 114.0579 + Math.random() * 0.1,
            latitude: 22.5431 + Math.random() * 0.1
          }
        },
        storeInfo: {
          storeType: '便利店',
          storeSize: '中型(50-200平)',
          monthlyRevenue: '1-5万'
        },
        businessStatus: '合作客户',
        salesRep: data.salesRep,
        isActive: true
      });
      stores.push(await store.save());
    }

    // 创建订单
    const orders = [];
    for (let i = 0; i < 10; i++) {
      const store = stores[Math.floor(Math.random() * stores.length)];
      const selectedProducts = products.slice(0, Math.floor(Math.random() * 4) + 1);
      
      const orderItems = selectedProducts.map(product => ({
        product: product._id,
        productName: product.name,
        quantity: Math.floor(Math.random() * 10) + 1,
        price: product.price,
        totalPrice: product.price * (Math.floor(Math.random() * 10) + 1)
      }));

      const totalAmount = orderItems.reduce((sum, item) => sum + item.totalPrice, 0);

      const order = new Order({
        customer: store._id,
        customerName: store.name,
        items: orderItems,
        totalAmount,
        status: ['pending', 'confirmed', 'shipped', 'delivered'][Math.floor(Math.random() * 4)],
        paymentStatus: ['pending', 'paid'][Math.floor(Math.random() * 2)],
        createdBy: store.managerId,
        shippingAddress: store.address,
        customerPhone: store.phone
      });
      orders.push(await order.save());
    }

    const summary = {
      success: true,
      message: '完整测试数据创建成功',
      data: {
        users: users.length,
        products: products.length,
        stores: stores.length,
        orders: orders.length
      },
      testAccounts: [
        { role: '管理员', phone: '13900000001', password: '123456' },
        { role: '区域经理', phone: '13900000002', password: '123456' },
        { role: '业务员', phone: '13900000003', password: '123456' },
        { role: '业务员', phone: '13900000004', password: '123456' }
      ]
    };

    console.log('测试数据创建完成:', summary);
    res.json(summary);

  } catch (error) {
    console.error('创建测试数据失败:', error);
    res.status(500).json({ 
      success: false, 
      message: '创建测试数据失败', 
      error: error.message 
    });
  }
});

// 清理数据库接口（仅用于开发测试）
app.post('/api/clear-database', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(500).json({ 
        success: false, 
        message: '数据库连接未就绪' 
      });
    }

    const User = require('./models/User');
    const Store = require('./models/Store');
    const Product = require('./models/Product');
    const Order = require('./models/Order');

    console.log('开始清理数据库...');

    const deletedUsers = await User.deleteMany({});
    const deletedStores = await Store.deleteMany({});
    const deletedProducts = await Product.deleteMany({});
    const deletedOrders = await Order.deleteMany({});

    const summary = {
      success: true,
      message: '数据库清理完成',
      deleted: {
        users: deletedUsers.deletedCount,
        stores: deletedStores.deletedCount,
        products: deletedProducts.deletedCount,
        orders: deletedOrders.deletedCount
      }
    };

    console.log('数据库清理完成:', summary);
    res.json(summary);

  } catch (error) {
    console.error('清理数据库失败:', error);
    res.status(500).json({ 
      success: false, 
      message: '清理数据库失败', 
      error: error.message 
    });
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