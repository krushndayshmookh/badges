const mongoose = require('mongoose')

let connected = false

async function connectToDB() {
  if (connected) {
    return
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI, {})
    connected = true
    // console.log('MongoDB connected')
  } catch (error) {
    console.error('MongoDB connection error:', error)
    throw error
  }
}

module.exports = { connectToDB }
