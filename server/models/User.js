const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['业务员', '区域经理', '管理员'],
    default: '业务员'
  },
  realName: {
    type: String,
    required: true
  },
  avatar: {
    type: String,
    default: ''
  },
  region: {
    type: String,
    required: true
  },
  territory: [{
    type: String
  }],
  salesTarget: {
    monthly: { type: Number, default: 0 },
    quarterly: { type: Number, default: 0 },
    yearly: { type: Number, default: 0 }
  },
  performance: {
    currentMonth: { type: Number, default: 0 },
    currentQuarter: { type: Number, default: 0 },
    currentYear: { type: Number, default: 0 }
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

module.exports = mongoose.model('User', userSchema);