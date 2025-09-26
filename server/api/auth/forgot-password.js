import { connectToDB } from '@@/server/db'
import { User } from '@@/server/models'
import { generateResetToken, hashResetToken } from '@@/server/utils/auth'
import { sendPasswordResetEmail } from '@@/server/utils/email'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)

    if (!body?.email || body.email.trim().length === 0) {
      setResponseStatus(event, 400)
      return {
        error: 'Email is required'
      }
    }

    await connectToDB()

    // Find user by email
    const user = await User.findOne({ 
      email: body.email.toLowerCase().trim() 
    })

    // Always return success message for security (don't reveal if email exists)
    if (!user) {
      return {
        message: 'If an account with that email exists, we have sent a password reset link.'
      }
    }

    // Generate reset token
    const resetToken = generateResetToken()
    const hashedToken = hashResetToken(resetToken)

    // Save hashed token and expiration to user
    user.resetPasswordToken = hashedToken
    user.resetPasswordExpires = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    await user.save()

    // Create reset URL
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/reset-password?token=${resetToken}`

    // Send password reset email
    const emailResult = await sendPasswordResetEmail(user.email, resetToken, resetUrl)

    if (!emailResult.success) {
      console.error('Failed to send password reset email:', emailResult.error)
      // Clear the reset token since email failed
      user.resetPasswordToken = undefined
      user.resetPasswordExpires = undefined
      await user.save()

      setResponseStatus(event, 500)
      return {
        error: 'Failed to send password reset email. Please try again later.'
      }
    }

    return {
      message: 'If an account with that email exists, we have sent a password reset link.'
    }

  } catch (error) {
    console.error('Error during password reset request:', error)
    setResponseStatus(event, 500)
    return {
      error: 'Internal server error. Please try again later.'
    }
  }
})