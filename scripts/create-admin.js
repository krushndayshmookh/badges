#!/usr/bin/env node

/**
 * Script to create the first admin user
 * Usage: node scripts/create-admin.js
 */

import mongoose from 'mongoose'
import readline from 'readline'
import dotenv from 'dotenv'

// Import models
import { User } from '../server/models/index.js'

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
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
    console.info('🚀 NST SDC Badges - Create Admin User Script\n')

    // Load environment variables if available
    dotenv.config({ path: '.env' })

    const MONGODB_URI =
      process.env.MONGODB_URI || 'mongodb://localhost:27017/badges'

    // Connect to MongoDB
    console.info('Connecting to MongoDB...')
    await mongoose.connect(MONGODB_URI)
    console.info('✅ Connected to MongoDB\n')

    // Check if any admin users already exist
    const existingAdmin = await User.findOne({ role: 'admin' })
    if (existingAdmin) {
      console.info('⚠️  An admin user already exists in the database.')
      console.info(`   Email: ${existingAdmin.email}`)
      console.info(`   Name: ${existingAdmin.fullName}\n`)

      const proceed = await question(
        'Do you want to create another admin user? (y/N): '
      )
      if (proceed.toLowerCase() !== 'y' && proceed.toLowerCase() !== 'yes') {
        console.info('❌ Cancelled by user')
        return
      }
    }

    // Collect user information
    console.info('Please provide the admin user details:\n')

    const firstName = await question('First Name: ')
    if (!firstName.trim()) {
      console.info('❌ First name is required')
      return
    }

    const lastName = await question('Last Name (optional): ')

    let githubUsername
    do {
      githubUsername = await question('GitHub Username: ')
      if (!githubUsername.trim()) {
        console.info('❌ GitHub username is required')
        continue
      }

      // Check if GitHub username is already taken
      const existingGithubUser = await User.findOne({
        githubUsername: githubUsername.trim(),
      })
      if (existingGithubUser) {
        console.info('❌ This GitHub username is already taken')
        githubUsername = null
      }
    } while (!githubUsername)

    let email
    do {
      email = await question('Email: ')
      if (!email.trim()) {
        console.info('❌ Email is required')
        continue
      }

      if (!validateEmail(email)) {
        console.info('❌ Please provide a valid email address')
        email = null
        continue
      }

      // Check if email is already taken
      const existingEmailUser = await User.findOne({
        email: email.toLowerCase().trim(),
      })
      if (existingEmailUser) {
        console.info('❌ This email is already taken')
        email = null
      }
    } while (!email)

    let password
    do {
      password = await question('Password (min 6 characters): ')
      if (!password || password.length < 6) {
        console.info('❌ Password must be at least 6 characters long')
        password = null
      }
    } while (!password)

    console.info('\n📝 Creating admin user...')

    // Create the admin user
    const adminUser = new User({
      firstName: firstName.trim(),
      lastName: lastName.trim() || '',
      githubUsername: githubUsername.trim(),
      email: email.toLowerCase().trim(),
      password: password,
      role: 'admin',
    })

    await adminUser.save()

    console.info('✅ Admin user created successfully!\n')
    console.info('📋 Admin User Details:')
    console.info(`   Name: ${adminUser.fullName}`)
    console.info(`   Email: ${adminUser.email}`)
    console.info(`   GitHub: ${adminUser.githubUsername}`)
    console.info(`   Role: ${adminUser.role}`)
    console.info(`   ID: ${adminUser._id}\n`)

    console.info('🎉 You can now use these credentials to sign in as an admin!')
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message)

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0]
      console.error(`   The ${field} is already in use.`)
    }
  } finally {
    rl.close()
    await mongoose.connection.close()
    console.info('\n👋 Disconnected from MongoDB')
    process.exit(0)
  }
}

// Handle script termination
process.on('SIGINT', async () => {
  console.info('\n👋 Script interrupted by user')
  rl.close()
  await mongoose.connection.close()
  process.exit(0)
})

// Run the script
createAdminUser().catch((error) => {
  console.error('❌ Script failed:', error)
  process.exit(1)
})
