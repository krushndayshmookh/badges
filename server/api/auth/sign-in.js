import { connectToDB } from '@@/server/db'
import { User } from '@@/server/models'
import { generateToken } from '@@/server/utils/auth'

const validationErrors = (details) => {
  const { email, password } = details
  const errors = []

  if (!email || email.trim().length === 0) {
    errors.push('Email is required')
  }

  if (!password || password.trim().length === 0) {
    errors.push('Password is required')
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

    // Find user by email and include password for comparison
    const user = await User.findOne({ 
      email: body.email.toLowerCase().trim() 
    }).select('+password')

    if (!user) {
      setResponseStatus(event, 401)
      return {
        error: 'Invalid email or password'
      }
    }

    // Check password
    const isPasswordValid = await user.comparePassword(body.password)
    if (!isPasswordValid) {
      setResponseStatus(event, 401)
      return {
        error: 'Invalid email or password'
      }
    }

    // Generate JWT token
    const token = generateToken(user._id)

    // Return user data without password
    const userData = user.toObject()
    delete userData.password

    return {
      message: 'Login successful',
      data: {
        user: userData,
        token
      }
    }

  } catch (error) {
    console.error('Error during sign-in:', error)
    setResponseStatus(event, 500)
    return {
      error: 'Internal server error. Please try again later.'
    }
  }
})
