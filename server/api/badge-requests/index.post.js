import { connectToDB } from '@@/server/db'
import { UserBadgeRequest, Badge } from '@@/server/models'
import { requireAuth } from '@@/server/middleware/auth'

export default defineEventHandler(async (event) => {
  try {
    // Require authentication for creating badge requests
    const requestingUser = await requireAuth(event)
    
    const body = await readBody(event)

    if (!body || !body.badgeId) {
      setResponseStatus(event, 400)
      return {
        error: 'Badge ID is required',
      }
    }

    await connectToDB()

    // Check if badge exists
    const badge = await Badge.findById(body.badgeId)
    if (!badge) {
      setResponseStatus(event, 404)
      return {
        error: 'Badge not found',
      }
    }

    // Check if user already has this badge
    const { UserBadge } = await import('@@/server/models')
    const existingBadge = await UserBadge.findOne({
      user: requestingUser._id,
      badge: body.badgeId,
    })

    if (existingBadge) {
      setResponseStatus(event, 400)
      return {
        error: 'You already have this badge',
      }
    }

    // Check if user already has a pending request for this badge
    const existingRequest = await UserBadgeRequest.findOne({
      user: requestingUser._id,
      badge: body.badgeId,
      status: 'pending',
    })

    if (existingRequest) {
      setResponseStatus(event, 400)
      return {
        error: 'You already have a pending request for this badge',
      }
    }

    // Create badge request
    const badgeRequest = new UserBadgeRequest({
      user: requestingUser._id,
      badge: body.badgeId,
      status: 'pending',
    })

    await badgeRequest.save()
    
    // Populate the badge details for response
    await badgeRequest.populate('badge')
    
    return { 
      message: 'Badge request created successfully',
      data: badgeRequest 
    }

  } catch (error) {
    // If it's an auth error, let it propagate
    if (error.statusCode === 401 || error.statusCode === 403) {
      throw error
    }

    console.error('Error creating badge request:', error)
    setResponseStatus(event, 500)
    return {
      error: 'Internal server error',
    }
  }
})