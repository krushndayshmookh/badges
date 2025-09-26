const mongoose = require('mongoose')
const bcrypt = require('bcrypt')

const UserSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String },
    githubUsername: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ['base', 'admin'], default: 'base' },
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpires: { type: Date, select: false },
    socialLinks: {
      twitter: { type: String },
      linkedin: { type: String },
      website: { type: String },
      portfolio: { type: String },
      gitlab: { type: String },
      stackoverflow: { type: String },
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    timestamps: true,
  }
)

UserSchema.virtual('fullName').get(function () {
  return this.firstName + (this.lastName ? ' ' + this.lastName : '')
})

UserSchema.virtual('githubAvatarUrl').get(function () {
  return `https://avatars.githubusercontent.com/${this.githubUsername}`
})

UserSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
  }
  next()
})

UserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password)
}

UserSchema.methods.isAdmin = function () {
  return this.role === 'admin'
}

const BadgeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    imageURL: { type: String, required: true },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    timestamps: true,
  }
)

const UserBadgeSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    badge: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Badge',
      required: true,
    },
    awardedAt: { type: Date, default: Date.now },
    awardedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false, // Made optional for system-awarded badges
    },
    userBadgeRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UserBadgeRequest',
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    timestamps: true,
  }
)

const UserBadgeRequestSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    badge: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Badge',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    requestedAt: { type: Date, default: Date.now },
    reviewedAt: { type: Date },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    userBadge: { type: mongoose.Schema.Types.ObjectId, ref: 'UserBadge' },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    timestamps: true,
  }
)

const User = mongoose.model('User', UserSchema)
const Badge = mongoose.model('Badge', BadgeSchema)
const UserBadge = mongoose.model('UserBadge', UserBadgeSchema)
const UserBadgeRequest = mongoose.model(
  'UserBadgeRequest',
  UserBadgeRequestSchema
)

module.exports = {
  User,
  Badge,
  UserBadge,
  UserBadgeRequest,
}
