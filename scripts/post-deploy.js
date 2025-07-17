#!/usr/bin/env node

/**
 * Railway部署后自动初始化脚本
 * 这个脚本会在Railway部署完成后自动运行，初始化测试数据
 */

const mongoose = require('mongoose');
const initRailwayProductionData = require('./railway-production-data');

async function postDeploy() {
  console.log('🚀 Railway部署后自动初始化开始...');
  console.log('环境:', process.env.NODE_ENV || 'development');
  console.log('时间:', new Date().toISOString());
  
  try {
    // 检查必要的环境变量
    if (!process.env.MONGO_URL && !process.env.MONGODB_URI) {
      console.error('❌ 缺少数据库连接配置');
      process.exit(1);
    }

    if (!process.env.JWT_SECRET) {
      console.error('❌ 缺少JWT密钥配置');
      process.exit(1);
    }

    // 运行数据初始化
    await initRailwayProductionData();
    
    console.log('✅ Railway部署后初始化完成');
    
  } catch (error) {
    console.error('❌ Railway部署后初始化失败:', error.message);
    // 不要让部署失败，只是记录错误
    console.log('⚠️ 可以手动运行 npm run railway:init 来初始化数据');
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  postDeploy();
}

module.exports = postDeploy;