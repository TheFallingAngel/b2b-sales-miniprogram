const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../server/models/User');
const Store = require('../server/models/Store');
const Product = require('../server/models/Product');
const Order = require('../server/models/Order');

async function createTestData() {
  try {
    console.log('🔗 连接数据库...');
    await mongoose.connect(process.env.MONGO_URL || process.env.MONGODB_URI || 'mongodb://localhost:27017/b2b_sales_dev');
    console.log('✅ 数据库连接成功');

    console.log('🗑️ 清理现有数据...');
    await Promise.all([
      User.deleteMany({}),
      Store.deleteMany({}),
      Product.deleteMany({}),
      Order.deleteMany({})
    ]);

    console.log('👤 创建测试用户...');
    const testUser = new User({
      username: 'test_sales',
      phone: '13800138000',
      password: '123456',
      realName: '张业务',
      region: '广东省深圳市',
      role: '业务员',
      territory: ['南山区', '福田区'],
      salesTarget: {
        monthly: 100000,
        quarterly: 300000,
        yearly: 1200000
      }
    });
    await testUser.save();
    console.log(`✅ 测试用户创建成功: ${testUser.realName} (${testUser.phone})`);

    console.log('🏪 创建测试门店...');
    const stores = [
      {
        storeName: '便民超市',
        storeCode: 'ST001',
        owner: { name: '王老板', phone: '13900139000' },
        address: {
          province: '广东省',
          city: '深圳市',
          district: '南山区',
          street: '科技园南区大道123号'
        },
        storeInfo: {
          storeType: '超市',
          storeSize: '中型(50-200平)',
          monthlyRevenue: '5-10万'
        },
        businessStatus: '合作客户',
        salesRep: testUser._id
      },
      {
        storeName: '小明便利店',
        storeCode: 'ST002',
        owner: { name: '小明', phone: '13700137000' },
        address: {
          province: '广东省',
          city: '深圳市',
          district: '福田区',
          street: '华强北路456号'
        },
        storeInfo: {
          storeType: '便利店',
          storeSize: '小型(<50平)',
          monthlyRevenue: '1-5万'
        },
        businessStatus: '意向客户',
        salesRep: testUser._id
      }
    ];

    const createdStores = await Store.insertMany(stores);
    console.log(`✅ 创建${createdStores.length}个测试门店`);

    console.log('📦 创建测试产品...');
    const products = [
      {
        productCode: 'P001',
        productName: '可口可乐 330ml*24罐',
        brand: '可口可乐',
        category: { primary: '饮料', secondary: '碳酸饮料' },
        specifications: { unit: '箱', netWeight: '330ml*24' },
        pricing: { wholesalePrice: 45, retailPrice: 60, minOrderQty: 1 },
        inventory: { totalStock: 500, availableStock: 450, safetyStock: 50 },
        priority: '高'
      },
      {
        productCode: 'P002',
        productName: '农夫山泉 550ml*24瓶',
        brand: '农夫山泉',
        category: { primary: '饮料', secondary: '饮用水' },
        specifications: { unit: '箱', netWeight: '550ml*24' },
        pricing: { wholesalePrice: 38, retailPrice: 50, minOrderQty: 1 },
        inventory: { totalStock: 800, availableStock: 750, safetyStock: 100 },
        priority: '中'
      },
      {
        productCode: 'P003',
        productName: '康师傅红烧牛肉面',
        brand: '康师傅',
        category: { primary: '食品', secondary: '方便面' },
        specifications: { unit: '箱', netWeight: '120g*24包' },
        pricing: { wholesalePrice: 65, retailPrice: 85, minOrderQty: 1 },
        inventory: { totalStock: 300, availableStock: 280, safetyStock: 30 },
        priority: '中'
      }
    ];

    const createdProducts = await Product.insertMany(products);
    console.log(`✅ 创建${createdProducts.length}个测试产品`);

    console.log('📋 创建测试订单...');
    const testOrder = new Order({
      orderType: '代客下单',
      store: createdStores[0]._id,
      salesRep: testUser._id,
      items: [
        {
          product: createdProducts[0]._id,
          quantity: 5,
          unitPrice: 45,
          totalPrice: 225,
          discount: 0,
          finalPrice: 225
        },
        {
          product: createdProducts[1]._id,
          quantity: 3,
          unitPrice: 38,
          totalPrice: 114,
          discount: 0,
          finalPrice: 114
        }
      ],
      orderSummary: {
        subtotal: 339,
        totalDiscount: 0,
        deliveryFee: 0,
        totalAmount: 339
      },
      paymentInfo: {
        paymentMethod: '现金',
        paymentStatus: '已付款'
      },
      deliveryInfo: {
        deliveryMethod: '送货上门',
        plannedDeliveryDate: new Date(Date.now() + 24 * 60 * 60 * 1000)
      },
      orderStatus: '已确认'
    });

    await testOrder.save();
    console.log('✅ 创建测试订单成功');

    console.log('\n🎉 测试数据创建完成！');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📱 测试账户信息:');
    console.log(`   用户名: test_sales`);
    console.log(`   手机号: 13800138000`);
    console.log(`   密码: 123456`);
    console.log(`   角色: 业务员`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🏪 测试门店: 2个');
    console.log('📦 测试产品: 3个');
    console.log('📋 测试订单: 1个');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  } catch (error) {
    console.error('❌ 创建测试数据失败:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔚 数据库连接已关闭');
  }
}

createTestData();