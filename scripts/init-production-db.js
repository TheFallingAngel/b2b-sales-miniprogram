const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../server/models/User');
const Store = require('../server/models/Store');
const Product = require('../server/models/Product');
const Order = require('../server/models/Order');

async function initProductionDatabase() {
  try {
    console.log('🔗 连接生产数据库...');
    console.log('数据库URI:', process.env.MONGO_URL || process.env.MONGODB_URI ? '已配置' : '❌ 未配置');
    
    await mongoose.connect(process.env.MONGO_URL || process.env.MONGODB_URI);
    console.log('✅ 数据库连接成功');

    // 检查现有数据
    const userCount = await User.countDocuments();
    console.log(`📊 现有用户数量: ${userCount}`);

    if (userCount > 0) {
      console.log('⚠️ 数据库已有数据，跳过初始化');
      return;
    }

    console.log('🏗️ 初始化生产环境数据...');

    // 创建管理员用户
    const adminUser = new User({
      username: 'admin',
      phone: '13800138000',
      password: '123456',
      realName: '系统管理员',
      region: '总部',
      role: '管理员',
      isActive: true
    });
    await adminUser.save();
    console.log('✅ 管理员用户创建成功');

    // 创建测试业务员
    const salesUser = new User({
      username: 'sales_test',
      phone: '13900139000',
      password: '123456',
      realName: '测试业务员',
      region: '广东深圳',
      role: '业务员',
      isActive: true
    });
    await salesUser.save();
    console.log('✅ 测试业务员创建成功');

    // 创建示例产品
    const products = [
      {
        name: '可口可乐 330ml',
        category: '饮料',
        brand: '可口可乐',
        price: 3.5,
        unit: '瓶',
        stock: 1000,
        isActive: true
      },
      {
        name: '康师傅方便面',
        category: '方便食品',
        brand: '康师傅',
        price: 4.2,
        unit: '包',
        stock: 500,
        isActive: true
      }
    ];

    for (const productData of products) {
      const product = new Product(productData);
      await product.save();
    }
    console.log('✅ 示例产品创建成功');

    // 创建示例门店
    const store = new Store({
      name: '测试便利店',
      address: '深圳市南山区测试路123号',
      contact: '张老板',
      phone: '13700137000',
      managerId: salesUser._id,
      status: 'active',
      location: {
        type: 'Point',
        coordinates: [114.0579, 22.5431] // 深圳坐标
      }
    });
    await store.save();
    console.log('✅ 示例门店创建成功');

    console.log('🎉 生产环境数据库初始化完成！');
    console.log('');
    console.log('📝 可用测试账户:');
    console.log('管理员 - 手机: 13800138000, 密码: 123456');
    console.log('业务员 - 手机: 13900139000, 密码: 123456');

  } catch (error) {
    console.error('❌ 初始化失败:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 数据库连接已关闭');
  }
}

// 运行初始化
initProductionDatabase();