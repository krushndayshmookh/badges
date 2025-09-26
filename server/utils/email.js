import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export const sendPasswordResetEmail = async (email, resetToken, resetUrl) => {
  try {
    await resend.emails.send({
      from: process.env.FROM_EMAIL || 'noreply@yourdomain.com',
      to: email,
      subject: 'Password Reset Request - NST SDC Badges',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Reset Request</h2>
          <p>You have requested a password reset for your NST SDC Badges account.</p>
          <p>Click the link below to reset your password:</p>
          <p>
            <a href="${resetUrl}" 
               style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
              Reset Password
            </a>
          </p>
          <p>Or copy and paste this URL into your browser:</p>
          <p style="word-break: break-all; color: #666;">${resetUrl}</p>
          <p><strong>This link will expire in 1 hour.</strong></p>
          <p>If you didn't request this password reset, please ignore this email.</p>
        </div>
      `,
    })
    return { success: true }
  } catch (error) {
    console.error('Error sending password reset email:', error)
    return { success: false, error: error.message }
  }
}

export const sendWelcomeEmail = async (email, firstName) => {
  try {
    await resend.emails.send({
      from: process.env.FROM_EMAIL || 'noreply@yourdomain.com',
      to: email,
      subject: 'Welcome to NST SDC Badges!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome to NST SDC Badges, ${firstName}!</h2>
          <p>Your account has been successfully created.</p>
          <p>You can now start earning badges and showcasing your achievements!</p>
          <p>If you have any questions, feel free to reach out to our support team.</p>
          <p>Happy badge collecting!</p>
        </div>
      `,
    })
    return { success: true }
  } catch (error) {
    console.error('Error sending welcome email:', error)
    return { success: false, error: error.message }
  }
}