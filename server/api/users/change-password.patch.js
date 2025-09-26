import { connectToDB } from '@@/server/db'
import { User } from '@@/server/models'
import { requireAuth } from '@@/server/middleware/auth'
import bcrypt from 'bcrypt'

const validationErrors = (details) => {
  const { currentPassword, newPassword, confirmPassword } = details
  const errors = []

  if (!currentPassword) {
    errors.push('Current password is required')
  }

  if (!newPassword) {
    errors.push('New password is required')
  } else if (newPassword.length < 6) {
    errors.push('New password must be at least 6 characters long')
  }

  if (!confirmPassword) {
    errors.push('Password confirmation is required')
  } else if (newPassword !== confirmPassword) {
    errors.push('New password and confirmation do not match')
  }

  if (currentPassword && newPassword && currentPassword === newPassword) {
    errors.push('New password must be different from current password')
  }

  return errors.length ? errors : null
}

export default defineEventHandler(async (event) => {
  try {
    // Require authentication - users can only change their own password
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

    // Verify current password
    const isValidCurrentPassword = await bcrypt.compare(body.currentPassword, userWithPassword.password)
    if (!isValidCurrentPassword) {
      setResponseStatus(event, 400)
      return {
        error: 'Current password is incorrect'
      }
    }

    // Hash new password
    const saltRounds = 12
    const hashedNewPassword = await bcrypt.hash(body.newPassword, saltRounds)

    // Update password
    await User.findByIdAndUpdate(
      user._id,
      { 
        password: hashedNewPassword,
        updatedAt: new Date()
      },
      { runValidators: true }
    )

    return {
      message: 'Password changed successfully'
    }

  } catch (error) {
    // If it's an auth error, let it propagate
    if (error.statusCode === 401 || error.statusCode === 403) {
      throw error
    }

    console.error('Error changing password:', error)
    setResponseStatus(event, 500)
    return {
      error: 'Internal server error',
    }
  }
})