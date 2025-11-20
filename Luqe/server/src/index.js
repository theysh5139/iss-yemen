require('dotenv').config()
const express = require('express')
const cors = require('cors')
const { connectDb } = require('./lib/db')
const authRoutes = require('./routes/auth')

const app = express()
app.use(cors())
app.use(express.json())

connectDb().then(async () => {
  // Seed a default admin if none exists
  const Admin = require('./models/Admin')
  const count = await Admin.countDocuments()
  if (count === 0) {
    const bcrypt = require('bcryptjs')
    const hash = await bcrypt.hash('admin123', 10)
    await Admin.create({ email: 'admin@example.com', passwordHash: hash, role: 'admin', name: 'Admin', status: 'active' })
    console.log('✅ Seeded default admin: admin@example.com / admin123')
  } else {
    console.log('✅ Admin user already exists')
  }
}).catch((err) => {
  console.error('❌ DB connection failed:', err.message)
  console.error('💡 Make sure MongoDB is running on localhost:27017')
  console.error('💡 Or set MONGODB_URI environment variable for a different connection')
  process.exit(1)
})

app.use('/api/admin', authRoutes)

// News/Announcements routes
const newsRoutes = require('./routes/news')
app.use('/api/news', newsRoutes)

// User/Admin management routes
const userRoutes = require('./routes/users')
app.use('/api/users', userRoutes)

app.get('/api/health', (_req, res) => res.json({ ok: true }))

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`Admin API listening on http://localhost:${PORT}`)
})


