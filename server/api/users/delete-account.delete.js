import { connectToDB } from '@@/server/db'
import { User, UserBadge, UserBadgeRequest } from '@@/server/models'
import { requireAuth } from '@@/server/middleware/auth'
import bcrypt from 'bcrypt'

const validationErrors = (details) => {
  const { password, confirmPassword } = details
  const errors = []

  if (!password) {
    errors.push('Password is required to confirm account deletion')
  }

  if (!confirmPassword) {
    errors.push('Password confirmation is required')
  } else if (password !== confirmPassword) {
    errors.push('Password and confirmation do not match')
  }

  return errors.length ? errors : null
}

export default defineEventHandler(async (event) => {
  try {
    // Require authentication - users can only delete their own account
    const user = await requireAuth(event)
    
    const body = await readBody(event)

    const errors = validationErrors(body)
    if (errors) {
      setResponseStatus(event, 400)
      return {
        error: 'Validation errors',
        details: errors
      }
    }

    await connectToDB()

    // Get user with password for verification
    const userWithPassword = await User.findById(user._id).select('+password')
    if (!userWithPassword) {
      setResponseStatus(event, 404)
      return {
        error: 'User not found'
      }
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(body.password, userWithPassword.password)
    if (!isValidPassword) {
      setResponseStatus(event, 400)
      return {
        error: 'Password is incorrect'
      }
    }

    // Check if user is the only admin
    if (user.role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' })
      if (adminCount <= 1) {
        setResponseStatus(event, 400)
        return {
          error: 'Cannot delete the only admin account. Please create another admin first.'
        }
      }
    }

    // Delete related data
    await UserBadge.deleteMany({ user: user._id })
    await UserBadgeRequest.deleteMany({ user: user._id })

    // Delete user account
    await User.findByIdAndDelete(user._id)

    return {
      message: 'Account deleted successfully'
    }

  } catch (error) {
    // If it's an auth error, let it propagate
    if (error.statusCode === 401 || error.statusCode === 403) {
      throw error
    }

    console.error('Error deleting account:', error)
    setResponseStatus(event, 500)
    return {
      error: 'Internal server error',
    }
  }
})