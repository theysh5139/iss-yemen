const { Schema, model } = require('mongoose')

const AdminSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    role: { type: String, default: 'admin' },
    name: { type: String, default: 'Admin' },
    status: { type: String, default: 'active', enum: ['active', 'inactive'] },
  },
  { timestamps: true }
)

module.exports = model('Admin', AdminSchema)

