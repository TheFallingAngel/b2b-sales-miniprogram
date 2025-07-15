# 🚀 Railway 部署指南

## 快速部署到Railway

### 步骤1: 准备GitHub仓库

```bash
# 如果还没有GitHub仓库，创建一个新仓库
# 然后添加远程仓库地址
git remote add origin https://github.com/yourusername/b2b-sales-miniprogram.git
git push -u origin master
```

### 步骤2: 部署到Railway

1. **访问 [Railway](https://railway.app)**
2. **登录并创建新项目**
   - 点击 "New Project"
   - 选择 "Deploy from GitHub repo"
   - 选择你的 `b2b-sales-miniprogram` 仓库

3. **添加MongoDB数据库**
   - 在Railway项目中点击 "+"
   - 选择 "Database" → "Add MongoDB"
   - Railway会自动创建MongoDB实例

4. **配置环境变量**
   在Railway项目设置中添加以下环境变量：
   ```
   NODE_ENV=production
   JWT_SECRET=your_super_secure_jwt_secret_key_2024
   MONGODB_URI=${MONGO_URL}  # Railway自动提供
   ```

5. **部署完成**
   - Railway会自动构建和部署
   - 获取应用的URL地址

### 步骤3: 测试部署

部署完成后，你的API将在以下地址可用：
```
https://your-app-name.railway.app/api/health
```

### 步骤4: 创建测试数据

部署成功后，你可以通过以下方式创建测试数据：

#### 方法1: 使用API接口注册
```bash
# 注册测试用户
curl -X POST https://your-app-name.railway.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "test_sales",
    "phone": "13800138000", 
    "password": "123456",
    "realName": "张业务",
    "region": "广东省深圳市"
  }'
```

#### 方法2: 本地连接生产数据库
```bash
# 设置生产数据库URL到本地环境变量
export MONGODB_URI="你的Railway MongoDB URL"
npm run create:testdata
```

## 📱 微信小程序配置

### 更新API域名
1. 打开 `miniprogram/app.js`
2. 修改 `baseUrl` 为Railway部署地址：
   ```javascript
   baseUrl: 'https://your-app-name.railway.app/api'
   ```

### 配置小程序域名白名单
在微信公众平台后台配置：
- 服务器域名: `https://your-app-name.railway.app`

## 🧪 功能测试

### 测试账户信息
```
用户名: test_sales
手机号: 13800138000
密码: 123456
角色: 业务员
```

### 主要功能测试流程

1. **用户登录**
   ```bash
   POST /api/auth/login
   {
     "phone": "13800138000",
     "password": "123456"
   }
   ```

2. **获取门店列表**
   ```bash
   GET /api/stores
   Headers: Authorization: Bearer <token>
   ```

3. **查看产品目录**
   ```bash
   GET /api/products
   Headers: Authorization: Bearer <token>
   ```

4. **创建订单**
   ```bash
   POST /api/orders
   Headers: Authorization: Bearer <token>
   Body: 订单数据
   ```

5. **查看数据分析**
   ```bash
   GET /api/analytics/dashboard
   Headers: Authorization: Bearer <token>
   ```

## 🔧 故障排除

### 常见问题

1. **部署失败**
   - 检查 `package.json` 的启动脚本
   - 确认 `railway.json` 配置正确

2. **数据库连接失败**
   - 检查环境变量 `MONGODB_URI` 是否正确
   - 确认MongoDB服务是否运行

3. **API接口500错误**
   - 查看Railway部署日志
   - 检查环境变量配置

### 查看日志
```bash
# 在Railway控制台查看应用日志
# 或使用Railway CLI
railway logs
```

## 📊 监控和维护

### 健康检查
```bash
curl https://your-app-name.railway.app/api/health
```

### 性能监控
- Railway提供内置的监控面板
- 可以查看CPU、内存、请求量等指标

### 数据备份
- Railway MongoDB会自动备份
- 建议定期导出重要数据

## 🎯 下一步

部署成功后，你可以：

1. **体验完整功能**
   - 登录系统查看仪表盘
   - 管理门店和客户信息
   - 创建订单和查看数据分析

2. **个性化配置**
   - 修改界面样式和文案
   - 调整业务规则和流程
   - 集成第三方服务

3. **扩展功能**
   - 添加消息推送
   - 集成地图服务
   - 对接ERP系统

---

需要帮助？查看 [Railway文档](https://docs.railway.app) 或联系技术支持。