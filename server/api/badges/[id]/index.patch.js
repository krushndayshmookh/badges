import { connectToDB } from '@@/server/db'
import { Badge } from '@@/server/models'
import { requireAdmin } from '@@/server/middleware/auth'

const validationErrors = (body) => {
  const errors = []
  
  if (body.name !== undefined && (!body.name || body.name.trim().length === 0)) {
    errors.push('Badge name cannot be empty')
  }
  
  if (body.description !== undefined && (!body.description || body.description.trim().length === 0)) {
    errors.push('Badge description cannot be empty')
  }
  
  if (body.imageURL !== undefined && (!body.imageURL || body.imageURL.trim().length === 0)) {
    errors.push('Badge image URL cannot be empty')
  }
  
  return errors.length ? errors : null
}

export default defineEventHandler(async (event) => {
  try {
    // Require admin authentication to update badges
    await requireAdmin(event)
    
    const badgeId = getRouterParam(event, 'id')
    const body = await readBody(event)

    if (!badgeId) {
      setResponseStatus(event, 400)
      return {
        error: 'Badge ID is required'
      }
    }

    const errors = validationErrors(body)
    if (errors) {
      setResponseStatus(event, 400)
      return {
        error: 'Validation errors',
        details: errors
      }
    }

    await connectToDB()

    // Find the badge
    const badge = await Badge.findById(badgeId)
    if (!badge) {
      setResponseStatus(event, 404)
      return {
        error: 'Badge not found'
      }
    }

    // Update only provided fields
    const updateData = {}
    if (body.name !== undefined) updateData.name = body.name.trim()
    if (body.description !== undefined) updateData.description = body.description.trim()
    if (body.imageURL !== undefined) updateData.imageURL = body.imageURL.trim()

    const updatedBadge = await Badge.findByIdAndUpdate(
      badgeId,
      updateData,
      { new: true, runValidators: true }
    )

    return {
      message: 'Badge updated successfully',
      data: updatedBadge
    }

  } catch (error) {
    // If it's an auth error, let it propagate
    if (error.statusCode === 401 || error.statusCode === 403) {
      throw error
    }

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0]
      setResponseStatus(event, 400)
      return {
        error: `The ${field} is already in use by another badge`
      }
    }

    console.error('Error updating badge:', error)
    setResponseStatus(event, 500)
    return {
      error: 'Internal server error'
    }
  }
})