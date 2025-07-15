const express = require('express');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const User = require('../models/User');

const router = express.Router();

const loginSchema = Joi.object({
  phone: Joi.string().pattern(/^1[3-9]\d{9}$/).required(),
  password: Joi.string().min(6).required()
});

const registerSchema = Joi.object({
  username: Joi.string().min(2).max(20).required(),
  phone: Joi.string().pattern(/^1[3-9]\d{9}$/).required(),
  password: Joi.string().min(6).required(),
  realName: Joi.string().min(2).max(10).required(),
  region: Joi.string().required(),
  role: Joi.string().valid('业务员', '区域经理', '管理员').default('业务员')
});

router.post('/login', async (req, res) => {
  try {
    const { error } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        success: false, 
        message: '输入格式错误',
        details: error.details[0].message
      });
    }

    const { phone, password } = req.body;
    const user = await User.findOne({ phone, isActive: true });
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: '用户不存在或已被禁用' 
      });
    }

    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ 
        success: false, 
        message: '密码错误' 
      });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign(
      { 
        userId: user._id, 
        role: user.role,
        region: user.region
      },
      process.env.JWT_SECRET || 'b2b_sales_secret_key',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: '登录成功',
      data: {
        token,
        user: user.toJSON()
      }
    });

  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '登录失败，请稍后重试' 
    });
  }
});

router.post('/register', async (req, res) => {
  try {
    const { error } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        success: false, 
        message: '输入格式错误',
        details: error.details[0].message
      });
    }

    const existingUser = await User.findOne({
      $or: [
        { phone: req.body.phone },
        { username: req.body.username }
      ]
    });

    if (existingUser) {
      return res.status(409).json({ 
        success: false, 
        message: '手机号或用户名已存在' 
      });
    }

    const user = new User(req.body);
    await user.save();

    const token = jwt.sign(
      { 
        userId: user._id, 
        role: user.role,
        region: user.region
      },
      process.env.JWT_SECRET || 'b2b_sales_secret_key',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: '注册成功',
      data: {
        token,
        user: user.toJSON()
      }
    });

  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '注册失败，请稍后重试' 
    });
  }
});

router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: '用户不存在' 
      });
    }

    res.json({
      success: true,
      data: { user }
    });

  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '获取用户信息失败' 
    });
  }
});

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: '访问令牌缺失' 
    });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'b2b_sales_secret_key', (err, user) => {
    if (err) {
      return res.status(403).json({ 
        success: false, 
        message: '访问令牌无效' 
      });
    }
    req.user = user;
    next();
  });
}

module.exports = router;
module.exports.authenticateToken = authenticateToken;