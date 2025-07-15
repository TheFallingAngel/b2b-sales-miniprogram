const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 启动B2B销售小程序本地开发环境...\n');

if (!fs.existsSync('.env')) {
  console.log('📝 创建本地环境配置文件...');
  const envContent = `# 本地开发环境配置
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/b2b_sales_dev
JWT_SECRET=b2b_sales_local_dev_secret_key_2024
`;
  fs.writeFileSync('.env', envContent);
  console.log('✅ .env 文件已创建');
}

console.log('📦 正在启动API服务器...');
const server = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  shell: true
});

server.on('error', (error) => {
  console.error('❌ 启动失败:', error.message);
});

server.on('close', (code) => {
  console.log(`\n🔴 服务器已关闭，退出码: ${code}`);
});

console.log(`
📱 B2B销售小程序开发环境
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🌐 API服务地址: http://localhost:3000
📋 健康检查: http://localhost:3000/api/health
📚 API文档: 查看 README.md

主要功能:
• 用户认证 (/api/auth)
• 门店管理 (/api/stores) 
• 产品管理 (/api/products)
• 订单管理 (/api/orders)
• 数据分析 (/api/analytics)
• 客户管理 (/api/customers)

按 Ctrl+C 停止服务
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);