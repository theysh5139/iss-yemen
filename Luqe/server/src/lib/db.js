const mongoose = require('mongoose')

async function connectDb() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/iss_yemen_club'
  mongoose.set('strictQuery', true)
  await mongoose.connect(uri)
  console.log('Connected to MongoDB')
}

module.exports = { connectDb }
