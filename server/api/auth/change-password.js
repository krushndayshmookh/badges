import { requireAuth } from '@@/server/middleware/auth'

const validationErrors = (details) => {
  const { currentPassword, newPassword } = details
  const errors = []

  if (!currentPassword || currentPassword.trim().length === 0) {
    errors.push('Current password is required')
  }

  if (!newPassword || newPassword.length < 6) {
    errors.push('New password must be at least 6 characters long')
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

    // Require authentication and get user with password
    const user = await requireAuth(event)
    
    // Get user with password for comparison
    const userWithPassword = await user.constructor.findById(user._id).select('+password')

    // Verify current password
    const isCurrentPasswordValid = await userWithPassword.comparePassword(body.currentPassword)
    if (!isCurrentPasswordValid) {
      setResponseStatus(event, 400)
      return {
        error: 'Current password is incorrect'
      }
    }

    // Update password
    userWithPassword.password = body.newPassword
    await userWithPassword.save()

    return {
      message: 'Password updated successfully'
    }

  } catch (error) {
    console.error('Error changing password:', error)
    setResponseStatus(event, 500)
    return {
      error: 'Internal server error. Please try again later.'
    }
  }
})