const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../server/models/User');
const Store = require('../server/models/Store');
const Product = require('../server/models/Product');
const Order = require('../server/models/Order');

async function createEnhancedTestData() {
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

    // 创建测试用户
    console.log('👤 创建测试用户...');
    const hashedPassword = await bcrypt.hash('123456', 10);
    const testUser = new User({
      phone: '13900000003',
      password: hashedPassword,
      realName: '张业务',
      role: '业务员',
      department: '华南区',
      territory: ['深圳', '广州', '东莞'],
      employeeId: 'EMP001',
      joinDate: new Date('2024-01-15'),
      isActive: true,
      salesTarget: {
        monthly: 180000,
        quarterly: 540000,
        yearly: 2160000
      }
    });
    await testUser.save();
    console.log('✅ 创建测试用户成功');

    // 创建测试门店
    console.log('🏪 创建测试门店...');
    const stores = [
      {
        storeName: '华联超市南山店',
        storeCode: 'ST20240101001',
        owner: {
          name: '李老板',
          phone: '13700000001',
          idCard: '440300199001011234',
          wechat: 'li_boss'
        },
        address: {
          province: '广东省',
          city: '深圳市',
          district: '南山区',
          street: '科技园南区深南大道9988号',
          coordinates: {
            longitude: 113.947,
            latitude: 22.540
          }
        },
        storeInfo: {
          storeType: '超市',
          businessHours: {
            open: '07:00',
            close: '23:00'
          },
          storeSize: '大型(>200平)',
          monthlyRevenue: '10-20万'
        },
        salesRep: testUser._id,
        businessStatus: '活跃客户',
        visitHistory: [
          {
            purpose: '首次拜访',
            notes: '初始建档',
            salesRep: testUser._id,
            visitDate: new Date('2024-01-15')
          },
          {
            purpose: '补货拜访',
            notes: '补充饮料类商品',
            salesRep: testUser._id,
            visitDate: new Date('2024-07-10')
          }
        ],
        orderHistory: {
          totalOrders: 15,
          totalAmount: 125800,
          lastOrderDate: new Date('2024-07-15'),
          avgOrderValue: 8387
        }
      },
      {
        storeName: '永辉超市福田店',
        storeCode: 'ST20240102002',
        owner: {
          name: '王经理',
          phone: '13700000002',
          wechat: 'wang_manager'
        },
        address: {
          province: '广东省',
          city: '深圳市',
          district: '福田区',
          street: '中心区福华一路国际商会大厦B1层',
          coordinates: {
            longitude: 114.060,
            latitude: 22.520
          }
        },
        storeInfo: {
          storeType: '超市',
          businessHours: {
            open: '08:00',
            close: '22:00'
          },
          storeSize: '大型(>200平)',
          monthlyRevenue: '>20万'
        },
        salesRep: testUser._id,
        businessStatus: '活跃客户',
        visitHistory: [
          {
            purpose: '首次拜访',
            notes: '初始建档',
            salesRep: testUser._id,
            visitDate: new Date('2024-02-01')
          }
        ],
        orderHistory: {
          totalOrders: 8,
          totalAmount: 89600,
          lastOrderDate: new Date('2024-07-12'),
          avgOrderValue: 11200
        }
      },
      {
        storeName: '小明便利店',
        storeCode: 'ST20240103003',
        owner: {
          name: '陈小明',
          phone: '13700000003'
        },
        address: {
          province: '广东省',
          city: '深圳市',
          district: '宝安区',
          street: '西乡街道宝源路168号',
          coordinates: {
            longitude: 113.850,
            latitude: 22.570
          }
        },
        storeInfo: {
          storeType: '便利店',
          businessHours: {
            open: '06:30',
            close: '24:00'
          },
          storeSize: '小型(<50平)',
          monthlyRevenue: '1-5万'
        },
        salesRep: testUser._id,
        businessStatus: '潜在客户',
        visitHistory: [
          {
            purpose: '首次拜访',
            notes: '初始建档，有合作意向',
            salesRep: testUser._id,
            visitDate: new Date('2024-07-01')
          }
        ],
        orderHistory: {
          totalOrders: 3,
          totalAmount: 12500,
          lastOrderDate: new Date('2024-07-05'),
          avgOrderValue: 4167
        }
      },
      {
        storeName: '美佳便利店',
        storeCode: 'ST20240104004',
        owner: {
          name: '赵女士',
          phone: '13700000004'
        },
        address: {
          province: '广东省',
          city: '深圳市',
          district: '龙华区',
          street: '民治街道梅龙路999号',
          coordinates: {
            longitude: 114.030,
            latitude: 22.620
          }
        },
        storeInfo: {
          storeType: '便利店',
          businessHours: {
            open: '07:00',
            close: '23:30'
          },
          storeSize: '小型(<50平)',
          monthlyRevenue: '1-5万'
        },
        salesRep: testUser._id,
        businessStatus: '潜在客户',
        visitHistory: [
          {
            purpose: '首次拜访',
            notes: '新开店，正在考虑供应商',
            salesRep: testUser._id,
            visitDate: new Date('2024-07-14')
          }
        ],
        orderHistory: {
          totalOrders: 0,
          totalAmount: 0,
          lastOrderDate: null,
          avgOrderValue: 0
        }
      }
    ];

    const savedStores = await Store.insertMany(stores);
    console.log('✅ 创建测试门店成功，共创建:', savedStores.length, '个门店');

    // 创建测试商品
    console.log('📦 创建测试商品...');
    const products = [
      {
        productCode: 'DRINK001',
        productName: '可口可乐 330ml',
        brand: '可口可乐',
        category: {
          primary: '饮料',
          secondary: '碳酸饮料'
        },
        specifications: {
          volume: '330ml',
          packaging: '罐装',
          shelfLife: '12个月'
        },
        pricing: {
          retailPrice: 3.5,
          wholesalePrice: 2.8,
          costPrice: 2.2,
          minOrderQty: 24
        },
        inventory: {
          totalStock: 5000,
          availableStock: 4500,
          reservedStock: 500,
          safetyStock: 200
        },
        salesData: {
          currentMonthSales: 1200,
          lastMonthSales: 1100,
          averageMonthlySales: 1050
        },
        images: ['/assets/images/coca-cola.jpg'],
        description: '经典口味可口可乐，330ml罐装',
        priority: 5,
        isActive: true,
        unit: '罐'
      },
      {
        productCode: 'DRINK002',
        productName: '雪碧 330ml',
        brand: '可口可乐',
        category: {
          primary: '饮料',
          secondary: '碳酸饮料'
        },
        specifications: {
          volume: '330ml',
          packaging: '罐装',
          shelfLife: '12个月'
        },
        pricing: {
          retailPrice: 3.5,
          wholesalePrice: 2.8,
          costPrice: 2.2,
          minOrderQty: 24
        },
        inventory: {
          totalStock: 3000,
          availableStock: 2800,
          reservedStock: 200,
          safetyStock: 300
        },
        salesData: {
          currentMonthSales: 800,
          lastMonthSales: 750,
          averageMonthlySales: 780
        },
        images: ['/assets/images/sprite.jpg'],
        description: '清爽柠檬味雪碧，330ml罐装',
        priority: 4,
        isActive: true,
        unit: '罐'
      },
      {
        productCode: 'SNACK001',
        productName: '乐事薯片原味 70g',
        brand: '乐事',
        category: {
          primary: '零食',
          secondary: '薯片'
        },
        specifications: {
          weight: '70g',
          packaging: '袋装',
          shelfLife: '9个月'
        },
        pricing: {
          retailPrice: 8.5,
          wholesalePrice: 6.8,
          costPrice: 5.2,
          minOrderQty: 12
        },
        inventory: {
          totalStock: 2000,
          availableStock: 1850,
          reservedStock: 150,
          safetyStock: 100
        },
        salesData: {
          currentMonthSales: 600,
          lastMonthSales: 580,
          averageMonthlySales: 590
        },
        images: ['/assets/images/lays-chips.jpg'],
        description: '乐事经典原味薯片，酥脆香甜',
        priority: 4,
        isActive: true,
        unit: '包'
      },
      {
        productCode: 'WATER001',
        productName: '农夫山泉 550ml',
        brand: '农夫山泉',
        category: {
          primary: '饮料',
          secondary: '矿泉水'
        },
        specifications: {
          volume: '550ml',
          packaging: '瓶装',
          shelfLife: '24个月'
        },
        pricing: {
          retailPrice: 2.0,
          wholesalePrice: 1.5,
          costPrice: 1.1,
          minOrderQty: 24
        },
        inventory: {
          totalStock: 8000,
          availableStock: 7200,
          reservedStock: 800,
          safetyStock: 500
        },
        salesData: {
          currentMonthSales: 2000,
          lastMonthSales: 1950,
          averageMonthlySales: 1980
        },
        images: ['/assets/images/nongfu-water.jpg'],
        description: '农夫山泉天然水，甘甜清冽',
        priority: 5,
        isActive: true,
        unit: '瓶'
      },
      {
        productCode: 'MILK001',
        productName: '蒙牛纯牛奶 250ml',
        brand: '蒙牛',
        category: {
          primary: '乳制品',
          secondary: '牛奶'
        },
        specifications: {
          volume: '250ml',
          packaging: '利乐包',
          shelfLife: '6个月'
        },
        pricing: {
          retailPrice: 4.2,
          wholesalePrice: 3.5,
          costPrice: 2.8,
          minOrderQty: 12
        },
        inventory: {
          totalStock: 1500,
          availableStock: 1200,
          reservedStock: 300,
          safetyStock: 200
        },
        salesData: {
          currentMonthSales: 400,
          lastMonthSales: 380,
          averageMonthlySales: 390
        },
        images: ['/assets/images/mengniu-milk.jpg'],
        description: '蒙牛纯牛奶，营养丰富',
        priority: 3,
        isActive: true,
        unit: '盒'
      },
      {
        productCode: 'INSTANT001',
        productName: '康师傅红烧牛肉面',
        brand: '康师傅',
        category: {
          primary: '方便食品',
          secondary: '方便面'
        },
        specifications: {
          weight: '120g',
          packaging: '桶装',
          shelfLife: '12个月'
        },
        pricing: {
          retailPrice: 5.5,
          wholesalePrice: 4.2,
          costPrice: 3.1,
          minOrderQty: 12
        },
        inventory: {
          totalStock: 1000,
          availableStock: 850,
          reservedStock: 150,
          safetyStock: 80
        },
        salesData: {
          currentMonthSales: 300,
          lastMonthSales: 280,
          averageMonthlySales: 290
        },
        images: ['/assets/images/kangshifu-noodles.jpg'],
        description: '康师傅经典红烧牛肉面，香辣可口',
        priority: 3,
        isActive: true,
        unit: '桶'
      },
      {
        productCode: 'TEA001',
        productName: '统一冰红茶 500ml',
        brand: '统一',
        category: {
          primary: '饮料',
          secondary: '茶饮料'
        },
        specifications: {
          volume: '500ml',
          packaging: '瓶装',
          shelfLife: '12个月'
        },
        pricing: {
          retailPrice: 3.0,
          wholesalePrice: 2.3,
          costPrice: 1.8,
          minOrderQty: 24
        },
        inventory: {
          totalStock: 2500,
          availableStock: 2200,
          reservedStock: 300,
          safetyStock: 200
        },
        salesData: {
          currentMonthSales: 650,
          lastMonthSales: 620,
          averageMonthlySales: 635
        },
        images: ['/assets/images/ice-tea.jpg'],
        description: '统一冰红茶，清香回甘',
        priority: 3,
        isActive: true,
        unit: '瓶'
      },
      {
        productCode: 'BISCUIT001',
        productName: '奥利奥饼干 原味',
        brand: '奥利奥',
        category: {
          primary: '零食',
          secondary: '饼干'
        },
        specifications: {
          weight: '388g',
          packaging: '盒装',
          shelfLife: '12个月'
        },
        pricing: {
          retailPrice: 12.8,
          wholesalePrice: 9.5,
          costPrice: 7.2,
          minOrderQty: 6
        },
        inventory: {
          totalStock: 800,
          availableStock: 720,
          reservedStock: 80,
          safetyStock: 50
        },
        salesData: {
          currentMonthSales: 180,
          lastMonthSales: 160,
          averageMonthlySales: 170
        },
        images: ['/assets/images/oreo.jpg'],
        description: '奥利奥原味夹心饼干，经典美味',
        priority: 2,
        isActive: true,
        unit: '盒'
      }
    ];

    const savedProducts = await Product.insertMany(products);
    console.log('✅ 创建测试商品成功，共创建:', savedProducts.length, '个商品');

    // 创建测试订单
    console.log('📋 创建测试订单...');
    const orders = [
      {
        orderNumber: 'ORD20240717001',
        orderType: '代客下单',
        store: savedStores[0]._id,
        salesRep: testUser._id,
        items: [
          {
            product: savedProducts[0]._id,
            quantity: 48,
            unitPrice: 2.8,
            totalPrice: 134.4,
            discount: 0,
            finalPrice: 134.4
          },
          {
            product: savedProducts[1]._id,
            quantity: 24,
            unitPrice: 2.8,
            totalPrice: 67.2,
            discount: 0,
            finalPrice: 67.2
          },
          {
            product: savedProducts[3]._id,
            quantity: 48,
            unitPrice: 1.5,
            totalPrice: 72.0,
            discount: 0,
            finalPrice: 72.0
          }
        ],
        orderStatus: '待确认',
        orderSummary: {
          subtotal: 273.6,
          totalDiscount: 0,
          deliveryFee: 0,
          totalAmount: 273.6
        },
        paymentInfo: {
          paymentMethod: '银行转账',
          creditDays: 0
        },
        deliveryInfo: {
          deliveryMethod: '送货上门',
          plannedDeliveryDate: new Date('2024-07-18'),
          deliveryAddress: '深圳市南山区科技园南区深南大道9988号华联超市'
        },
        statusHistory: [
          {
            status: '待确认',
            notes: '订单创建',
            operator: testUser._id,
            timestamp: new Date()
          }
        ],
        notes: '定期补货订单'
      },
      {
        orderNumber: 'ORD20240716002',
        orderType: '补货订单',
        store: savedStores[1]._id,
        salesRep: testUser._id,
        items: [
          {
            product: savedProducts[2]._id,
            quantity: 24,
            unitPrice: 6.8,
            totalPrice: 163.2,
            discount: 0,
            finalPrice: 163.2
          },
          {
            product: savedProducts[4]._id,
            quantity: 36,
            unitPrice: 3.5,
            totalPrice: 126.0,
            discount: 0,
            finalPrice: 126.0
          }
        ],
        orderStatus: '已确认',
        orderSummary: {
          subtotal: 289.2,
          totalDiscount: 0,
          deliveryFee: 10,
          totalAmount: 299.2
        },
        paymentInfo: {
          paymentMethod: '现金',
          creditDays: 0
        },
        deliveryInfo: {
          deliveryMethod: '送货上门',
          plannedDeliveryDate: new Date('2024-07-17'),
          deliveryAddress: '深圳市福田区中心区福华一路国际商会大厦B1层'
        },
        statusHistory: [
          {
            status: '待确认',
            notes: '订单创建',
            operator: testUser._id,
            timestamp: new Date('2024-07-16T09:00:00Z')
          },
          {
            status: '已确认',
            notes: '订单确认',
            operator: testUser._id,
            timestamp: new Date('2024-07-16T10:30:00Z')
          }
        ],
        notes: '永辉超市补货需求'
      },
      {
        orderNumber: 'ORD20240715003',
        orderType: '门店自主下单',
        store: savedStores[2]._id,
        salesRep: testUser._id,
        items: [
          {
            product: savedProducts[0]._id,
            quantity: 24,
            unitPrice: 2.8,
            totalPrice: 67.2,
            discount: 0,
            finalPrice: 67.2
          },
          {
            product: savedProducts[5]._id,
            quantity: 12,
            unitPrice: 4.2,
            totalPrice: 50.4,
            discount: 0,
            finalPrice: 50.4
          }
        ],
        orderStatus: '已发货',
        orderSummary: {
          subtotal: 117.6,
          totalDiscount: 0,
          deliveryFee: 10,
          totalAmount: 127.6
        },
        paymentInfo: {
          paymentMethod: '微信支付',
          creditDays: 0
        },
        deliveryInfo: {
          deliveryMethod: '第三方物流',
          plannedDeliveryDate: new Date('2024-07-16'),
          deliveryAddress: '深圳市宝安区西乡街道宝源路168号'
        },
        statusHistory: [
          {
            status: '待确认',
            notes: '订单创建',
            operator: testUser._id,
            timestamp: new Date('2024-07-15T14:00:00Z')
          },
          {
            status: '已确认',
            notes: '订单确认',
            operator: testUser._id,
            timestamp: new Date('2024-07-15T15:00:00Z')
          },
          {
            status: '已发货',
            notes: '订单发货',
            operator: testUser._id,
            timestamp: new Date('2024-07-16T09:00:00Z')
          }
        ],
        notes: '小明便利店首次下单'
      }
    ];

    const savedOrders = await Order.insertMany(orders);
    console.log('✅ 创建测试订单成功，共创建:', savedOrders.length, '个订单');

    console.log('\n🎉 增强测试数据创建完成！');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📱 测试账户信息:');
    console.log(`   手机号: 13900000003`);
    console.log(`   密码: 123456`);
    console.log(`   角色: 业务员`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 测试数据统计：');
    console.log(`   用户: 1个`);
    console.log(`   门店: ${savedStores.length}个 (包含活跃客户和潜在客户)`);
    console.log(`   商品: ${savedProducts.length}个 (覆盖饮料、零食、乳制品等多个分类)`);
    console.log(`   订单: ${savedOrders.length}个 (不同状态的订单)`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔧 特色功能数据:');
    console.log('   ✅ 门店拜访记录');
    console.log('   ✅ 订单状态流转');
    console.log('   ✅ 商品库存管理');
    console.log('   ✅ 销售业绩数据');
    console.log('   ✅ 用户权限角色');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
  } catch (error) {
    console.error('❌ 创建增强测试数据失败:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔚 数据库连接已关闭');
  }
}

createEnhancedTestData();