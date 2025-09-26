#!/usr/bin/env node

/**
 * Script to create the first admin user
 * Usage: node scripts/create-admin.js
 */

const mongoose = require('mongoose')
const readline = require('readline')

// Import models
const { User } = require('../server/models/index.js')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

const question = (query) => {
  return new Promise((resolve) => {
    rl.question(query, resolve)
  })
}

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

const createAdminUser = async () => {
  try {
    console.log('🚀 NST SDC Badges - Create Admin User Script\n')

    // Load environment variables if available
    require('dotenv').config({ path: '.env' })

    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/badges'

    // Connect to MongoDB
    console.log('Connecting to MongoDB...')
    await mongoose.connect(MONGODB_URI)
    console.log('✅ Connected to MongoDB\n')

    // Check if any admin users already exist
    const existingAdmin = await User.findOne({ role: 'admin' })
    if (existingAdmin) {
      console.log('⚠️  An admin user already exists in the database.')
      console.log(`   Email: ${existingAdmin.email}`)
      console.log(`   Name: ${existingAdmin.fullName}\n`)
      
      const proceed = await question('Do you want to create another admin user? (y/N): ')
      if (proceed.toLowerCase() !== 'y' && proceed.toLowerCase() !== 'yes') {
        console.log('❌ Cancelled by user')
        return
      }
    }

    // Collect user information
    console.log('Please provide the admin user details:\n')

    const firstName = await question('First Name: ')
    if (!firstName.trim()) {
      console.log('❌ First name is required')
      return
    }

    const lastName = await question('Last Name (optional): ')

    let githubUsername
    do {
      githubUsername = await question('GitHub Username: ')
      if (!githubUsername.trim()) {
        console.log('❌ GitHub username is required')
        continue
      }

      // Check if GitHub username is already taken
      const existingGithubUser = await User.findOne({ githubUsername: githubUsername.trim() })
      if (existingGithubUser) {
        console.log('❌ This GitHub username is already taken')
        githubUsername = null
      }
    } while (!githubUsername)

    let email
    do {
      email = await question('Email: ')
      if (!email.trim()) {
        console.log('❌ Email is required')
        continue
      }

      if (!validateEmail(email)) {
        console.log('❌ Please provide a valid email address')
        email = null
        continue
      }

      // Check if email is already taken
      const existingEmailUser = await User.findOne({ email: email.toLowerCase().trim() })
      if (existingEmailUser) {
        console.log('❌ This email is already taken')
        email = null
      }
    } while (!email)

    let password
    do {
      password = await question('Password (min 6 characters): ')
      if (!password || password.length < 6) {
        console.log('❌ Password must be at least 6 characters long')
        password = null
      }
    } while (!password)

    console.log('\n📝 Creating admin user...')

    // Create the admin user
    const adminUser = new User({
      firstName: firstName.trim(),
      lastName: lastName.trim() || '',
      githubUsername: githubUsername.trim(),
      email: email.toLowerCase().trim(),
      password: password,
      role: 'admin'
    })

    await adminUser.save()

    console.log('✅ Admin user created successfully!\n')
    console.log('📋 Admin User Details:')
    console.log(`   Name: ${adminUser.fullName}`)
    console.log(`   Email: ${adminUser.email}`)
    console.log(`   GitHub: ${adminUser.githubUsername}`)
    console.log(`   Role: ${adminUser.role}`)
    console.log(`   ID: ${adminUser._id}\n`)

    console.log('🎉 You can now use these credentials to sign in as an admin!')

  } catch (error) {
    console.error('❌ Error creating admin user:', error.message)
    
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0]
      console.error(`   The ${field} is already in use.`)
    }
  } finally {
    rl.close()
    await mongoose.connection.close()
    console.log('\n👋 Disconnected from MongoDB')
    process.exit(0)
  }
}

// Handle script termination
process.on('SIGINT', async () => {
  console.log('\n👋 Script interrupted by user')
  rl.close()
  await mongoose.connection.close()
  process.exit(0)
})

// Run the script
createAdminUser().catch((error) => {
  console.error('❌ Script failed:', error)
  process.exit(1)
})