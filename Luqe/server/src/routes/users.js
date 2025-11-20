const express = require('express')
const Admin = require('../models/Admin')
const jwt = require('jsonwebtoken')

const router = express.Router()

// Middleware to verify admin token
function verifyAdmin(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ message: 'Unauthorized' })
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret')
    if (decoded.role !== 'admin') return res.status(403).json({ message: 'Forbidden' })
    req.user = decoded
    next()
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' })
  }
}

// Get all admins/users
router.get('/', verifyAdmin, async (req, res) => {
  try {
    const admins = await Admin.find().select('-passwordHash').sort({ createdAt: -1 })
    res.json(admins)
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
})

// Get single admin/user
router.get('/:id', verifyAdmin, async (req, res) => {
  try {
    const admin = await Admin.findById(req.params.id).select('-passwordHash')
    if (!admin) return res.status(404).json({ message: 'User not found' })
    res.json(admin)
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
})

// Update admin profile
router.put('/profile', verifyAdmin, async (req, res) => {
  try {
    const { email, name } = req.body
    const admin = await Admin.findByIdAndUpdate(
      req.user.sub,
      { email, name },
      { new: true, runValidators: true }
    ).select('-passwordHash')
    if (!admin) return res.status(404).json({ message: 'User not found' })
    res.json(admin)
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
})

// Change password
router.put('/password', verifyAdmin, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new password required' })
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' })
    }

    const admin = await Admin.findById(req.user.sub)
    if (!admin) return res.status(404).json({ message: 'User not found' })

    const bcrypt = require('bcryptjs')
    const valid = await bcrypt.compare(currentPassword, admin.passwordHash)
    if (!valid) return res.status(401).json({ message: 'Current password incorrect' })

    const hash = await bcrypt.hash(newPassword, 10)
    admin.passwordHash = hash
    await admin.save()
    res.json({ message: 'Password updated successfully' })
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
})

// Deactivate user (soft delete by setting status)
router.put('/:id/deactivate', verifyAdmin, async (req, res) => {
  try {
    const admin = await Admin.findByIdAndUpdate(
      req.params.id,
      { status: 'inactive' },
      { new: true }
    ).select('-passwordHash')
    if (!admin) return res.status(404).json({ message: 'User not found' })
    res.json(admin)
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
})

// Activate user
router.put('/:id/activate', verifyAdmin, async (req, res) => {
  try {
    const admin = await Admin.findByIdAndUpdate(
      req.params.id,
      { status: 'active' },
      { new: true }
    ).select('-passwordHash')
    if (!admin) return res.status(404).json({ message: 'User not found' })
    res.json(admin)
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
})

// Delete user
router.delete('/:id', verifyAdmin, async (req, res) => {
  try {
    if (req.params.id === req.user.sub) {
      return res.status(400).json({ message: 'Cannot delete your own account' })
    }
    const admin = await Admin.findByIdAndDelete(req.params.id)
    if (!admin) return res.status(404).json({ message: 'User not found' })
    res.json({ message: 'User deleted successfully' })
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router


