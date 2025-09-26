import mongoose from 'mongoose'

let connected = false

export async function connectToDB() {
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
