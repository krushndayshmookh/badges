import { connectToDB } from '@@/server/db'
import { User } from '@@/server/models'
import { hashResetToken, generateToken } from '@@/server/utils/auth'

const validationErrors = (details) => {
  const { token, password } = details
  const errors = []

  if (!token || token.trim().length === 0) {
    errors.push('Reset token is required')
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

    // Hash the provided token to compare with stored hash
    const hashedToken = hashResetToken(body.token)

    // Find user with matching reset token and check if not expired
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    }).select('+resetPasswordToken +resetPasswordExpires')

    if (!user) {
      setResponseStatus(event, 400)
      return {
        error: 'Invalid or expired reset token'
      }
    }

    // Update password and clear reset token fields
    user.password = body.password
    user.resetPasswordToken = undefined
    user.resetPasswordExpires = undefined
    await user.save()

    // Generate new JWT token for automatic login
    const token = generateToken(user._id)

    // Return user data without sensitive fields
    const userData = user.toObject()
    delete userData.password
    delete userData.resetPasswordToken
    delete userData.resetPasswordExpires

    return {
      message: 'Password reset successful',
      data: {
        user: userData,
        token
      }
    }

  } catch (error) {
    console.error('Error during password reset:', error)
    setResponseStatus(event, 500)
    return {
      error: 'Internal server error. Please try again later.'
    }
  }
})