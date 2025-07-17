const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../server/models/User');
const Store = require('../server/models/Store');
const Product = require('../server/models/Product');
const Order = require('../server/models/Order');

async function initRailwayProductionData() {
  try {
    console.log('🚀 Railway生产环境数据初始化开始...');
    console.log('环境变量检查:');
    console.log('- MONGO_URL:', process.env.MONGO_URL ? '✅ 已配置' : '❌ 未配置');
    console.log('- MONGODB_URI:', process.env.MONGODB_URI ? '✅ 已配置' : '❌ 未配置');
    console.log('- JWT_SECRET:', process.env.JWT_SECRET ? '✅ 已配置' : '❌ 未配置');
    console.log('- NODE_ENV:', process.env.NODE_ENV || '未设置');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // 连接数据库
    console.log('🔗 连接Railway数据库...');
    await mongoose.connect(process.env.MONGO_URL || process.env.MONGODB_URI);
    console.log('✅ Railway数据库连接成功');

    // 检查现有数据
    const [userCount, storeCount, productCount, orderCount] = await Promise.all([
      User.countDocuments(),
      Store.countDocuments(),
      Product.countDocuments(),
      Order.countDocuments()
    ]);

    console.log('📊 现有数据统计:');
    console.log(`- 用户: ${userCount}个`);
    console.log(`- 门店: ${storeCount}个`);
    console.log(`- 商品: ${productCount}个`);
    console.log(`- 订单: ${orderCount}个`);

    // 如果不是强制重置，且已有数据，则跳过
    if (userCount > 0 && !process.argv.includes('--force')) {
      console.log('⚠️ 数据库已有数据，如需重置请使用 --force 参数');
      console.log('现有测试账户: 13900000003 / 123456');
      return;
    }

    if (process.argv.includes('--force')) {
      console.log('🗑️ 强制重置，清理现有数据...');
      await Promise.all([
        User.deleteMany({}),
        Store.deleteMany({}),
        Product.deleteMany({}),
        Order.deleteMany({})
      ]);
      console.log('✅ 数据清理完成');
    }

    console.log('🏗️ 开始创建生产环境测试数据...');

    // 创建测试用户
    console.log('👤 创建测试用户...');
    const hashedPassword = await bcrypt.hash('123456', 10);
    
    const users = [
      {
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
      },
      {
        phone: '13800000001',
        password: hashedPassword,
        realName: '李经理',
        role: '区域经理',
        department: '华南区',
        territory: ['深圳', '广州', '东莞', '佛山'],
        employeeId: 'MGR001',
        joinDate: new Date('2023-06-01'),
        isActive: true,
        salesTarget: {
          monthly: 500000,
          quarterly: 1500000,
          yearly: 6000000
        }
      },
      {
        phone: '13700000001',
        password: hashedPassword,
        realName: '王管理员',
        role: '管理员',
        department: '总部',
        territory: ['全国'],
        employeeId: 'ADM001',
        joinDate: new Date('2023-01-01'),
        isActive: true,
        salesTarget: {
          monthly: 0,
          quarterly: 0,
          yearly: 0
        }
      }
    ];

    const savedUsers = await User.insertMany(users);
    console.log(`✅ 创建用户成功: ${savedUsers.length}个`);

    // 获取业务员用户
    const salesUser = savedUsers.find(u => u.role === '业务员');

    // 创建测试门店
    console.log('🏪 创建测试门店...');
    const stores = [
      {
        storeName: '华联超市南山店',
        storeCode: 'HLS001',
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
        salesRep: salesUser._id,
        businessStatus: '活跃客户',
        visitHistory: [
          {
            purpose: '首次拜访',
            notes: '建立合作关系，了解经营情况',
            salesRep: salesUser._id,
            visitDate: new Date('2024-01-15')
          },
          {
            purpose: '补货拜访',
            notes: '夏季饮料销售旺季补货',
            salesRep: salesUser._id,
            visitDate: new Date('2024-07-10')
          }
        ],
        orderHistory: {
          totalOrders: 25,
          totalAmount: 186500,
          lastOrderDate: new Date('2024-07-15'),
          avgOrderValue: 7460
        }
      },
      {
        storeName: '永辉超市福田店',
        storeCode: 'YH001',
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
        salesRep: salesUser._id,
        businessStatus: '活跃客户',
        visitHistory: [
          {
            purpose: '首次拜访',
            notes: '连锁超市，潜力很大',
            salesRep: salesUser._id,
            visitDate: new Date('2024-02-01')
          },
          {
            purpose: '产品推介',
            notes: '推广新品类，获得认可',
            salesRep: salesUser._id,
            visitDate: new Date('2024-06-15')
          }
        ],
        orderHistory: {
          totalOrders: 18,
          totalAmount: 158900,
          lastOrderDate: new Date('2024-07-12'),
          avgOrderValue: 8828
        }
      },
      {
        storeName: '小明便利店',
        storeCode: 'XM001',
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
        salesRep: salesUser._id,
        businessStatus: '潜在客户',
        visitHistory: [
          {
            purpose: '首次拜访',
            notes: '个体户，需要培养信任',
            salesRep: salesUser._id,
            visitDate: new Date('2024-07-01')
          }
        ],
        orderHistory: {
          totalOrders: 6,
          totalAmount: 18600,
          lastOrderDate: new Date('2024-07-08'),
          avgOrderValue: 3100
        }
      },
      {
        storeName: '美佳便利店',
        storeCode: 'MJ001',
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
        salesRep: salesUser._id,
        businessStatus: '潜在客户',
        visitHistory: [
          {
            purpose: '首次拜访',
            notes: '新开店，正在考虑供应商合作',
            salesRep: salesUser._id,
            visitDate: new Date('2024-07-14')
          }
        ],
        orderHistory: {
          totalOrders: 0,
          totalAmount: 0,
          lastOrderDate: null,
          avgOrderValue: 0
        }
      },
      {
        storeName: '天虹商场罗湖店',
        storeCode: 'TH001',
        owner: {
          name: '刘总监',
          phone: '13700000005',
          wechat: 'liu_director'
        },
        address: {
          province: '广东省',
          city: '深圳市',
          district: '罗湖区',
          street: '解放路3008号天虹商场1楼',
          coordinates: {
            longitude: 114.124,
            latitude: 22.548
          }
        },
        storeInfo: {
          storeType: '超市',
          businessHours: {
            open: '09:00',
            close: '22:00'
          },
          storeSize: '大型(>200平)',
          monthlyRevenue: '>20万'
        },
        salesRep: salesUser._id,
        businessStatus: '活跃客户',
        visitHistory: [
          {
            purpose: '首次拜访',
            notes: '商场超市，要求较高',
            salesRep: salesUser._id,
            visitDate: new Date('2024-03-01')
          }
        ],
        orderHistory: {
          totalOrders: 12,
          totalAmount: 96500,
          lastOrderDate: new Date('2024-07-05'),
          avgOrderValue: 8042
        }
      }
    ];

    const savedStores = await Store.insertMany(stores);
    console.log(`✅ 创建门店成功: ${savedStores.length}个`);

    // 创建测试商品
    console.log('📦 创建测试商品...');
    const products = [
      {
        productCode: 'DRINK001',
        productName: '可口可乐 330ml',
        brand: '可口可乐',
        category: { primary: '饮料', secondary: '碳酸饮料' },
        specifications: { volume: '330ml', packaging: '罐装', shelfLife: '12个月' },
        pricing: { retailPrice: 3.5, wholesalePrice: 2.8, costPrice: 2.2, minOrderQty: 24 },
        inventory: { totalStock: 8000, availableStock: 7200, reservedStock: 800, safetyStock: 300 },
        salesData: { currentMonthSales: 1800, lastMonthSales: 1650, averageMonthlySales: 1720 },
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
        category: { primary: '饮料', secondary: '碳酸饮料' },
        specifications: { volume: '330ml', packaging: '罐装', shelfLife: '12个月' },
        pricing: { retailPrice: 3.5, wholesalePrice: 2.8, costPrice: 2.2, minOrderQty: 24 },
        inventory: { totalStock: 5000, availableStock: 4600, reservedStock: 400, safetyStock: 250 },
        salesData: { currentMonthSales: 1200, lastMonthSales: 1100, averageMonthlySales: 1150 },
        images: ['/assets/images/sprite.jpg'],
        description: '清爽柠檬味雪碧，330ml罐装',
        priority: 4,
        isActive: true,
        unit: '罐'
      },
      {
        productCode: 'WATER001',
        productName: '农夫山泉 550ml',
        brand: '农夫山泉',
        category: { primary: '饮料', secondary: '矿泉水' },
        specifications: { volume: '550ml', packaging: '瓶装', shelfLife: '24个月' },
        pricing: { retailPrice: 2.0, wholesalePrice: 1.5, costPrice: 1.1, minOrderQty: 24 },
        inventory: { totalStock: 12000, availableStock: 10800, reservedStock: 1200, safetyStock: 600 },
        salesData: { currentMonthSales: 3200, lastMonthSales: 3000, averageMonthlySales: 3100 },
        images: ['/assets/images/nongfu-water.jpg'],
        description: '农夫山泉天然水，甘甜清冽',
        priority: 5,
        isActive: true,
        unit: '瓶'
      },
      {
        productCode: 'SNACK001',
        productName: '乐事薯片原味 70g',
        brand: '乐事',
        category: { primary: '零食', secondary: '薯片' },
        specifications: { weight: '70g', packaging: '袋装', shelfLife: '9个月' },
        pricing: { retailPrice: 8.5, wholesalePrice: 6.8, costPrice: 5.2, minOrderQty: 12 },
        inventory: { totalStock: 3000, availableStock: 2700, reservedStock: 300, safetyStock: 150 },
        salesData: { currentMonthSales: 850, lastMonthSales: 800, averageMonthlySales: 825 },
        images: ['/assets/images/lays-chips.jpg'],
        description: '乐事经典原味薯片，酥脆香甜',
        priority: 4,
        isActive: true,
        unit: '包'
      },
      {
        productCode: 'MILK001',
        productName: '蒙牛纯牛奶 250ml',
        brand: '蒙牛',
        category: { primary: '乳制品', secondary: '牛奶' },
        specifications: { volume: '250ml', packaging: '利乐包', shelfLife: '6个月' },
        pricing: { retailPrice: 4.2, wholesalePrice: 3.5, costPrice: 2.8, minOrderQty: 12 },
        inventory: { totalStock: 2500, availableStock: 2200, reservedStock: 300, safetyStock: 200 },
        salesData: { currentMonthSales: 650, lastMonthSales: 600, averageMonthlySales: 625 },
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
        category: { primary: '方便食品', secondary: '方便面' },
        specifications: { weight: '120g', packaging: '桶装', shelfLife: '12个月' },
        pricing: { retailPrice: 5.5, wholesalePrice: 4.2, costPrice: 3.1, minOrderQty: 12 },
        inventory: { totalStock: 1800, availableStock: 1600, reservedStock: 200, safetyStock: 100 },
        salesData: { currentMonthSales: 480, lastMonthSales: 450, averageMonthlySales: 465 },
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
        category: { primary: '饮料', secondary: '茶饮料' },
        specifications: { volume: '500ml', packaging: '瓶装', shelfLife: '12个月' },
        pricing: { retailPrice: 3.0, wholesalePrice: 2.3, costPrice: 1.8, minOrderQty: 24 },
        inventory: { totalStock: 4000, availableStock: 3600, reservedStock: 400, safetyStock: 200 },
        salesData: { currentMonthSales: 900, lastMonthSales: 850, averageMonthlySales: 875 },
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
        category: { primary: '零食', secondary: '饼干' },
        specifications: { weight: '388g', packaging: '盒装', shelfLife: '12个月' },
        pricing: { retailPrice: 12.8, wholesalePrice: 9.5, costPrice: 7.2, minOrderQty: 6 },
        inventory: { totalStock: 1200, availableStock: 1000, reservedStock: 200, safetyStock: 80 },
        salesData: { currentMonthSales: 320, lastMonthSales: 300, averageMonthlySales: 310 },
        images: ['/assets/images/oreo.jpg'],
        description: '奥利奥原味夹心饼干，经典美味',
        priority: 2,
        isActive: true,
        unit: '盒'
      },
      {
        productCode: 'CANDY001',
        productName: '大白兔奶糖 500g',
        brand: '大白兔',
        category: { primary: '零食', secondary: '糖果' },
        specifications: { weight: '500g', packaging: '袋装', shelfLife: '12个月' },
        pricing: { retailPrice: 15.8, wholesalePrice: 12.5, costPrice: 9.8, minOrderQty: 6 },
        inventory: { totalStock: 800, availableStock: 700, reservedStock: 100, safetyStock: 50 },
        salesData: { currentMonthSales: 180, lastMonthSales: 160, averageMonthlySales: 170 },
        images: ['/assets/images/white-rabbit.jpg'],
        description: '大白兔奶糖，经典童年味道',
        priority: 2,
        isActive: true,
        unit: '袋'
      },
      {
        productCode: 'YOGURT001',
        productName: '安慕希酸奶 原味',
        brand: '伊利',
        category: { primary: '乳制品', secondary: '酸奶' },
        specifications: { volume: '205g', packaging: '盒装', shelfLife: '21天' },
        pricing: { retailPrice: 6.8, wholesalePrice: 5.2, costPrice: 4.1, minOrderQty: 12 },
        inventory: { totalStock: 1500, availableStock: 1300, reservedStock: 200, safetyStock: 100 },
        salesData: { currentMonthSales: 420, lastMonthSales: 380, averageMonthlySales: 400 },
        images: ['/assets/images/anmuxi-yogurt.jpg'],
        description: '安慕希希腊式酸奶，浓郁香甜',
        priority: 3,
        isActive: true,
        unit: '盒'
      }
    ];

    const savedProducts = await Product.insertMany(products);
    console.log(`✅ 创建商品成功: ${savedProducts.length}个`);

    // 创建测试订单
    console.log('📋 创建测试订单...');
    const orders = [
      {
        orderNumber: 'ORD202407170001',
        orderType: '代客下单',
        store: savedStores[0]._id,
        salesRep: salesUser._id,
        items: [
          { product: savedProducts[0]._id, quantity: 48, unitPrice: 2.8, totalPrice: 134.4, discount: 0, finalPrice: 134.4 },
          { product: savedProducts[1]._id, quantity: 24, unitPrice: 2.8, totalPrice: 67.2, discount: 0, finalPrice: 67.2 },
          { product: savedProducts[2]._id, quantity: 48, unitPrice: 1.5, totalPrice: 72.0, discount: 0, finalPrice: 72.0 }
        ],
        orderStatus: '待确认',
        orderSummary: { subtotal: 273.6, totalDiscount: 0, deliveryFee: 0, totalAmount: 273.6 },
        paymentInfo: { paymentMethod: '银行转账', creditDays: 0 },
        deliveryInfo: { 
          deliveryMethod: '送货上门', 
          plannedDeliveryDate: new Date('2024-07-18'),
          deliveryAddress: '深圳市南山区科技园南区深南大道9988号华联超市'
        },
        statusHistory: [{ status: '待确认', notes: '订单创建', operator: salesUser._id, timestamp: new Date() }],
        notes: '华联超市夏季饮料补货'
      },
      {
        orderNumber: 'ORD202407160002',
        orderType: '补货订单',
        store: savedStores[1]._id,
        salesRep: salesUser._id,
        items: [
          { product: savedProducts[3]._id, quantity: 24, unitPrice: 6.8, totalPrice: 163.2, discount: 0, finalPrice: 163.2 },
          { product: savedProducts[4]._id, quantity: 36, unitPrice: 3.5, totalPrice: 126.0, discount: 0, finalPrice: 126.0 },
          { product: savedProducts[7]._id, quantity: 12, unitPrice: 9.5, totalPrice: 114.0, discount: 0, finalPrice: 114.0 }
        ],
        orderStatus: '已确认',
        orderSummary: { subtotal: 403.2, totalDiscount: 0, deliveryFee: 10, totalAmount: 413.2 },
        paymentInfo: { paymentMethod: '现金', creditDays: 0 },
        deliveryInfo: { 
          deliveryMethod: '送货上门', 
          plannedDeliveryDate: new Date('2024-07-17'),
          deliveryAddress: '深圳市福田区中心区福华一路国际商会大厦B1层'
        },
        statusHistory: [
          { status: '待确认', notes: '订单创建', operator: salesUser._id, timestamp: new Date('2024-07-16T09:00:00Z') },
          { status: '已确认', notes: '订单确认', operator: salesUser._id, timestamp: new Date('2024-07-16T10:30:00Z') }
        ],
        notes: '永辉超市零食乳制品补货'
      },
      {
        orderNumber: 'ORD202407150003',
        orderType: '门店自主下单',
        store: savedStores[2]._id,
        salesRep: salesUser._id,
        items: [
          { product: savedProducts[0]._id, quantity: 24, unitPrice: 2.8, totalPrice: 67.2, discount: 0, finalPrice: 67.2 },
          { product: savedProducts[5]._id, quantity: 12, unitPrice: 4.2, totalPrice: 50.4, discount: 0, finalPrice: 50.4 }
        ],
        orderStatus: '已发货',
        orderSummary: { subtotal: 117.6, totalDiscount: 0, deliveryFee: 10, totalAmount: 127.6 },
        paymentInfo: { paymentMethod: '微信支付', creditDays: 0 },
        deliveryInfo: { 
          deliveryMethod: '第三方物流', 
          plannedDeliveryDate: new Date('2024-07-16'),
          deliveryAddress: '深圳市宝安区西乡街道宝源路168号'
        },
        statusHistory: [
          { status: '待确认', notes: '订单创建', operator: salesUser._id, timestamp: new Date('2024-07-15T14:00:00Z') },
          { status: '已确认', notes: '订单确认', operator: salesUser._id, timestamp: new Date('2024-07-15T15:00:00Z') },
          { status: '已发货', notes: '订单发货', operator: salesUser._id, timestamp: new Date('2024-07-16T09:00:00Z') }
        ],
        notes: '小明便利店基础商品补货'
      },
      {
        orderNumber: 'ORD202407140004',
        orderType: '代客下单',
        store: savedStores[4]._id,
        salesRep: salesUser._id,
        items: [
          { product: savedProducts[6]._id, quantity: 48, unitPrice: 2.3, totalPrice: 110.4, discount: 0, finalPrice: 110.4 },
          { product: savedProducts[9]._id, quantity: 24, unitPrice: 5.2, totalPrice: 124.8, discount: 0, finalPrice: 124.8 }
        ],
        orderStatus: '已完成',
        orderSummary: { subtotal: 235.2, totalDiscount: 0, deliveryFee: 0, totalAmount: 235.2 },
        paymentInfo: { paymentMethod: '银行转账', creditDays: 0 },
        deliveryInfo: { 
          deliveryMethod: '送货上门', 
          plannedDeliveryDate: new Date('2024-07-15'),
          deliveryAddress: '深圳市罗湖区解放路3008号天虹商场1楼',
          actualDeliveryDate: new Date('2024-07-15T16:30:00Z')
        },
        statusHistory: [
          { status: '待确认', notes: '订单创建', operator: salesUser._id, timestamp: new Date('2024-07-14T11:00:00Z') },
          { status: '已确认', notes: '订单确认', operator: salesUser._id, timestamp: new Date('2024-07-14T14:00:00Z') },
          { status: '已发货', notes: '订单发货', operator: salesUser._id, timestamp: new Date('2024-07-15T09:00:00Z') },
          { status: '已完成', notes: '订单完成', operator: salesUser._id, timestamp: new Date('2024-07-15T17:00:00Z') }
        ],
        notes: '天虹商场茶饮料和酸奶订单'
      }
    ];

    const savedOrders = await Order.insertMany(orders);
    console.log(`✅ 创建订单成功: ${savedOrders.length}个`);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 Railway生产环境数据初始化完成！');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📱 测试账户信息:');
    console.log(`   业务员: 13900000003 / 123456 (${salesUser.realName})`);
    console.log(`   经理: 13800000001 / 123456 (${savedUsers[1].realName})`);
    console.log(`   管理员: 13700000001 / 123456 (${savedUsers[2].realName})`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 数据统计:');
    console.log(`   用户: ${savedUsers.length}个 (覆盖所有角色)`);
    console.log(`   门店: ${savedStores.length}个 (不同规模和状态)`);
    console.log(`   商品: ${savedProducts.length}个 (完整分类体系)`);
    console.log(`   订单: ${savedOrders.length}个 (不同状态流转)`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔧 特色功能:');
    console.log('   ✅ 完整的权限角色体系');
    console.log('   ✅ 门店拜访记录和历史');
    console.log('   ✅ 订单状态完整流转');
    console.log('   ✅ 商品库存和销售数据');
    console.log('   ✅ 地理位置坐标信息');
    console.log('   ✅ 销售业绩和目标数据');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  } catch (error) {
    console.error('❌ Railway生产环境数据初始化失败:', error);
    console.error('错误详情:', error.message);
    if (error.stack) {
      console.error('错误堆栈:', error.stack);
    }
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 数据库连接已关闭');
  }
}

// 运行初始化
if (require.main === module) {
  initRailwayProductionData();
}

module.exports = initRailwayProductionData;