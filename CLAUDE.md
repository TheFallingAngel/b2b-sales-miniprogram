# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是一个B2B销售助手微信小程序项目，专为快消品行业设计。包含Node.js后端API服务器和微信小程序前端，支持门店管理、产品展示、订单处理和数据分析功能。

## 核心开发命令

```bash
# 开发环境启动
npm run dev                    # 启动后端开发服务器(使用nodemon)
npm run start:local           # 本地环境启动脚本

# 数据管理
npm run create:testdata       # 创建测试数据到MongoDB

# 生产环境
npm start                     # 生产模式启动服务器
```

## 技术架构

### 后端架构 (server/)
- **框架**: Express.js + MongoDB + Mongoose
- **认证**: JWT Token + bcryptjs密码加密
- **验证**: Joi数据验证库
- **安全**: Helmet + CORS
- **主入口**: `server/index.js`

### 前端架构 (miniprogram/)
- **平台**: 微信小程序原生开发
- **网络**: 封装的wx.request API调用
- **配置**: `miniprogram/app.json`

### 数据模型结构
核心数据模型位于 `server/models/`:
- `User.js` - 用户系统(业务员/区域经理/管理员角色)
- `Store.js` - 门店客户管理(包含客户生命周期状态)
- `Product.js` - 产品目录和库存管理
- `Order.js` - 订单交易和状态跟踪

### API路由架构
REST API路由位于 `server/routes/`:
- `/api/auth/*` - JWT认证和用户管理
- `/api/stores/*` - 门店和客户管理
- `/api/products/*` - 产品目录管理
- `/api/orders/*` - 订单处理系统
- `/api/analytics/*` - 数据分析接口
- `/api/customers/*` - 客户关系管理

## 开发环境配置

### 测试数据账户
运行 `npm run create:testdata` 后可使用:
- 用户名: test_sales
- 手机号: 13800138000
- 密码: 123456
- 角色: 业务员

### 环境变量
主要配置在 `.env` 文件:
- `MONGODB_URI` - MongoDB连接字符串
- `JWT_SECRET` - JWT密钥
- `PORT` - 服务器端口

## 部署配置

### Railway部署
项目配置在 `railway.json` 和 `nixpacks.toml`:
- 自动从GitHub部署
- MongoDB Atlas数据库
- 环境变量通过Railway控制台配置

## 微信小程序特殊配置

### 权限要求
- 地理位置权限 - 门店定位功能
- 后台位置权限 - 拜访记录

### 页面结构
Tab Bar导航包含5个主要模块:
- 首页 (index)
- 门店 (stores) 
- 产品 (products)
- 订单 (orders)
- 数据 (analytics)

## 重要开发注意事项

### 认证机制
所有API请求需要在Header中包含JWT Token:
```javascript
Authorization: Bearer <token>
```

### 数据验证
使用Joi库进行输入验证，模式定义在各路由文件中。

### 错误处理
统一错误响应格式:
```javascript
{
  success: false,
  message: "错误描述",
  error: "详细错误信息"
}
```

### 角色权限系统
用户角色层级: 业务员 < 区域经理 < 管理员
权限检查在路由中间件中实现。

## 数据库设计要点

### 关键索引
- User: phone(唯一索引)
- Store: managerId + name(复合索引)
- Order: customerId + createdAt(复合索引)

### 状态管理
- 客户状态: potential/active/inactive
- 订单状态: pending/confirmed/shipped/delivered/cancelled
- 支付状态: pending/paid/failed/refunded