require('dotenv').config()
const mongoose = require('mongoose')
const Admin = require('./src/models/Admin')
const bcrypt = require('bcryptjs')

async function test() {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/iss_yemen_club'
    console.log('Connecting to MongoDB...', uri)
    await mongoose.connect(uri)
    console.log('✅ Connected to MongoDB')
    
    // Check if admin exists
    const count = await Admin.countDocuments()
    console.log(`Admin count: ${count}`)
    
    if (count === 0) {
      console.log('Creating default admin...')
      const hash = await bcrypt.hash('admin123', 10)
      const admin = await Admin.create({ 
        email: 'admin@example.com', 
        passwordHash: hash, 
        role: 'admin' 
      })
      console.log('✅ Created admin:', admin.email)
    } else {
      const admin = await Admin.findOne({ email: 'admin@example.com' })
      if (admin) {
        console.log('✅ Admin exists:', admin.email)
        // Test password
        const ok = await bcrypt.compare('admin123', admin.passwordHash)
        console.log('Password test:', ok ? '✅ PASS' : '❌ FAIL')
      } else {
        console.log('❌ Admin not found')
      }
    }
    
    await mongoose.disconnect()
    console.log('✅ Test completed')
  } catch (err) {
    console.error('❌ Error:', err.message)
    process.exit(1)
  }
}

test()

