const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const Admin = require('../models/Admin')

const router = express.Router()

router.post('/login', async (req, res) => {
  const { email, password } = req.body || {}
  if (!email || !password) return res.status(400).json({ message: 'Email and password required' })
  const admin = await Admin.findOne({ email })
  if (!admin) return res.status(401).json({ message: 'Invalid credentials' })
  const ok = await bcrypt.compare(password, admin.passwordHash)
  if (!ok) return res.status(401).json({ message: 'Invalid credentials' })
  const token = jwt.sign({ sub: admin._id.toString(), role: admin.role }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '1d' })
  res.json({ token })
})

router.post('/register', async (req, res) => {
  const { email, password, name } = req.body || {}
  if (!email || !password) return res.status(400).json({ message: 'Email and password required' })
  const existing = await Admin.findOne({ email })
  if (existing) return res.status(409).json({ message: 'Email already registered' })
  const hash = await bcrypt.hash(password, 10)
  await Admin.create({ email, passwordHash: hash, role: 'admin', name: name || 'Admin', status: 'active' })
  return res.status(201).json({ ok: true })
})

module.exports = router


