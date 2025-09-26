import { connectToDB } from '@@/server/db'
import { User } from '@@/server/models'
import { requireAuth } from '@@/server/middleware/auth'

const validateUrl = (url) => {
  if (!url) return true // Empty URLs are allowed
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

const validationErrors = (details) => {
  const { socialLinks } = details
  const errors = []

  if (!socialLinks || typeof socialLinks !== 'object') {
    errors.push('Social links must be an object')
    return errors
  }

  const allowedFields = ['twitter', 'linkedin', 'website', 'portfolio', 'gitlab', 'stackoverflow']
  const providedFields = Object.keys(socialLinks)
  
  // Check for invalid fields
  const invalidFields = providedFields.filter(field => !allowedFields.includes(field))
  if (invalidFields.length > 0) {
    errors.push(`Invalid social link fields: ${invalidFields.join(', ')}`)
  }

  // Validate URLs
  for (const [field, url] of Object.entries(socialLinks)) {
    if (allowedFields.includes(field) && url && !validateUrl(url)) {
      errors.push(`Invalid URL format for ${field}`)
    }
  }

  return errors.length ? errors : null
}

export default defineEventHandler(async (event) => {
  try {
    // Require authentication - users can only update their own social links
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

    // Update only the social links
    const allowedFields = ['twitter', 'linkedin', 'website', 'portfolio', 'gitlab', 'stackoverflow']
    const socialLinksUpdate = {}

    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(body.socialLinks, field)) {
        socialLinksUpdate[`socialLinks.${field}`] = body.socialLinks[field] || ''
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      socialLinksUpdate,
      { new: true, runValidators: true }
    )

    return {
      message: 'Social links updated successfully',
      data: updatedUser
    }

  } catch (error) {
    // If it's an auth error, let it propagate
    if (error.statusCode === 401 || error.statusCode === 403) {
      throw error
    }

    console.error('Error updating social links:', error)
    setResponseStatus(event, 500)
    return {
      error: 'Internal server error',
    }
  }
})