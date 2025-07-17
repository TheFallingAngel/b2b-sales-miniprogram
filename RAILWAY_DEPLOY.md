# Railway部署指南

## 🚀 快速部署

### 1. 部署到Railway

1. **Fork这个项目**到你的GitHub账户
2. **登录Railway** (https://railway.app)
3. **创建新项目** → 选择从GitHub导入
4. **选择你Fork的仓库**

### 2. 配置环境变量

在Railway项目的Variables页面添加以下环境变量：

**⚠️ 重要：如果你的MongoDB服务显示连接失败，请确保在Railway控制台中正确设置了以下环境变量**

```bash
# 必需的环境变量
MONGO_URL=mongodb://mongodb-production-208a.up.railway.app:27017
JWT_SECRET=your_jwt_secret_key_here
NODE_ENV=production

# 可选的环境变量
PORT=3000
```

### 3. 数据库配置

#### 选项A: 使用Railway内置MongoDB (当前配置)
1. 在项目中添加MongoDB服务
2. 设置环境变量：
   ```
   MONGO_URL=mongodb://mongodb-production-208a.up.railway.app:27017
   ```

#### 选项B: 使用MongoDB Atlas
1. 注册MongoDB Atlas账户
2. 创建免费集群
3. 获取连接字符串设置到`MONGO_URL`

### 4. 初始化测试数据

部署完成后，访问以下URL初始化测试数据：

```bash
# 方法1: 通过API接口初始化
curl -X POST https://b2b-sales-miniprogram-production.up.railway.app/api/railway-init

# 方法2: 通过Railway控制台运行
npm run railway:init
```

## 📱 测试账户

初始化完成后可用以下账户测试：

| 角色 | 手机号 | 密码 | 说明 |
|------|--------|------|------|
| 业务员 | 13900000003 | 123456 | 主要测试账户 |
| 区域经理 | 13800000001 | 123456 | 管理角色 |
| 管理员 | 13700000001 | 123456 | 最高权限 |

## 🔧 管理命令

```bash
# 检查服务状态
curl https://b2b-sales-miniprogram-production.up.railway.app/api/health

# 初始化测试数据
npm run railway:init

# 强制重置所有数据
npm run railway:reset

# 测试数据库连接
npm run test:db
```

## 📊 测试数据包含

✅ **用户数据** (3个不同角色)
✅ **门店数据** (5个不同类型门店)
✅ **商品数据** (10个不同分类商品)
✅ **订单数据** (4个不同状态订单)
✅ **拜访记录** (门店拜访历史)
✅ **地理位置** (深圳地区坐标)

## 🛠️ 开发配置

### 本地开发环境

1. **克隆项目**
```bash
git clone <your-repo>
cd b2b-sales-miniprogram
```

2. **安装依赖**
```bash
npm install
```

3. **配置环境变量**
```bash
cp .env.example .env
# 编辑.env文件配置数据库连接
```

4. **启动开发服务器**
```bash
npm run dev
```

5. **创建测试数据**
```bash
npm run create:testdata
```

### 微信小程序配置

1. **微信开发者工具** 导入 `miniprogram` 目录
2. **修改API地址** 在 `miniprogram/app.js` 中更新：
```javascript
const API_BASE_URL = 'https://b2b-sales-miniprogram-production.up.railway.app/api';
```

## 🔒 安全配置

### 生产环境安全

1. **更改默认密码**
```javascript
// 首次登录后立即更改测试账户密码
```

2. **JWT密钥**
```bash
# 生成强随机密钥
JWT_SECRET=$(openssl rand -base64 32)
```

3. **数据库安全**
- 使用强密码
- 启用IP白名单
- 定期备份数据

## 📈 监控和日志

### Railway日志
- 在Railway控制台查看实时日志
- 监控API调用和错误

### 健康检查
```bash
# API健康检查
GET /api/health

# 返回示例
{
  "status": "ok",
  "message": "B2B销售小程序API服务运行正常",
  "version": "1.0.1",
  "timestamp": "2024-07-17T10:30:00.000Z"
}
```

## 🆘 故障排除

### 常见问题

1. **数据库连接失败**
```bash
# 检查MONGO_URL环境变量是否正确设置
# 确认MongoDB服务已在Railway中启动
# 验证连接字符串格式：
# mongodb://mongodb-production-208a.up.railway.app:27017

# 如果显示"数据库连接未就绪"，请在Railway控制台执行：
# 1. 确认MongoDB服务正在运行
# 2. 检查环境变量MONGO_URL是否正确
# 3. 重新部署服务
```

2. **API调用失败**
```bash
# 检查JWT_SECRET是否设置
# 验证服务器启动状态
# 查看Railway日志错误信息
```

3. **小程序无法连接**
```bash
# 检查小程序API地址配置
# 验证域名白名单设置
# 确认服务器CORS配置
```

### 联系支持

如遇问题可：
1. 查看Railway部署日志
2. 检查GitHub Issues
3. 确认环境变量配置

---

## 🎯 下一步

部署成功后建议：

1. ✅ 测试所有API接口
2. ✅ 验证小程序功能
3. ✅ 配置域名和SSL
4. ✅ 设置监控告警
5. ✅ 规划数据备份策略