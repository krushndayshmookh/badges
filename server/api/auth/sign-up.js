import { connectToDB } from '@@/server/db'
import { User } from '@@/server/models'
import { generateToken } from '@@/server/utils/auth'
import { sendWelcomeEmail } from '@@/server/utils/email'

const validationErrors = (details) => {
  const { firstName, githubUsername, email, password } = details

  const errors = []
  
  if (!firstName || firstName.trim().length === 0) {
    errors.push('First name is required')
  }

  if (!githubUsername || githubUsername.trim().length === 0) {
    errors.push('GitHub username is required')
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!email || !emailRegex.test(email)) {
    errors.push('Please provide a valid email address')
  }

  if (!password || password.length < 6) {
    errors.push('Password must be at least 6 characters long')
  }

  return errors.length ? errors : null
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)

    const errors = validationErrors(body)
    if (errors) {
      setResponseStatus(event, 400)
      return {
        error: 'Validation errors',
        details: errors,
      }
    }

    await connectToDB()

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { email: body.email },
        { githubUsername: body.githubUsername }
      ]
    })

    if (existingUser) {
      setResponseStatus(event, 400)
      return {
        error: existingUser.email === body.email 
          ? 'An account with this email already exists'
          : 'An account with this GitHub username already exists'
      }
    }

    // Create new user
    const user = new User({
      firstName: body.firstName.trim(),
      lastName: body.lastName?.trim() || '',
      githubUsername: body.githubUsername.trim(),
      email: body.email.toLowerCase().trim(),
      password: body.password,
    })

    await user.save()

    // Generate JWT token
    const token = generateToken(user._id)

    // Send welcome email (don't wait for it to complete)
    sendWelcomeEmail(user.email, user.firstName).catch(console.error)

    // Return user data without password
    const userData = user.toObject()
    delete userData.password

    setResponseStatus(event, 201)
    return {
      message: 'Account created successfully',
      data: {
        user: userData,
        token
      }
    }

  } catch (error) {
    console.error('Error creating user:', error)

    // Handle duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0]
      setResponseStatus(event, 400)
      return {
        error: `An account with this ${field} already exists`
      }
    }

    setResponseStatus(event, 500)
    return {
      error: 'Internal server error. Please try again later.'
    }
  }
})
