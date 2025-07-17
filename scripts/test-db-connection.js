const mongoose = require('mongoose');
require('dotenv').config();

async function testDatabaseConnection() {
  try {
    console.log('🔗 测试数据库连接...');
    console.log('数据库URI:', process.env.MONGODB_URI ? '已配置' : '未配置');
    
    // 连接数据库
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ 数据库连接成功');

    // 测试读取权限
    console.log('📖 测试读取权限...');
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('集合列表:', collections.map(c => c.name));

    // 测试写入权限
    console.log('✏️ 测试写入权限...');
    const testCollection = mongoose.connection.db.collection('test_connection');
    
    // 插入测试文档
    const testDoc = {
      message: '测试写入权限',
      timestamp: new Date(),
      source: 'Railway测试'
    };
    
    const insertResult = await testCollection.insertOne(testDoc);
    console.log('✅ 写入测试成功, ID:', insertResult.insertedId);

    // 读取测试文档
    const readResult = await testCollection.findOne({ _id: insertResult.insertedId });
    console.log('📖 读取测试成功:', readResult.message);

    // 删除测试文档
    await testCollection.deleteOne({ _id: insertResult.insertedId });
    console.log('🗑️ 清理测试数据完成');

    console.log('🎉 数据库读写权限测试全部通过！');

  } catch (error) {
    console.error('❌ 数据库测试失败:');
    console.error('错误类型:', error.name);
    console.error('错误信息:', error.message);
    
    if (error.code) {
      console.error('错误代码:', error.code);
    }
    
    // 具体错误诊断
    if (error.message.includes('authentication failed')) {
      console.error('🔑 认证失败 - 检查用户名密码');
    } else if (error.message.includes('not authorized')) {
      console.error('🚫 权限不足 - 检查用户角色权限');
    } else if (error.message.includes('timeout')) {
      console.error('⏰ 连接超时 - 检查网络访问白名单');
    } else if (error.message.includes('ENOTFOUND')) {
      console.error('🌐 DNS解析失败 - 检查连接字符串');
    }
    
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 数据库连接已关闭');
  }
}

// 运行测试
testDatabaseConnection();