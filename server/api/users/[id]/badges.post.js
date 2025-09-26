import { connectToDB } from '@@/server/db'
import { UserBadge, User, Badge } from '@@/server/models'
import { requireAdmin } from '@@/server/middleware/auth'

export default defineEventHandler(async (event) => {
  try {
    // Require admin authentication to award badges
    const awardingAdmin = await requireAdmin(event)
    
    const userId = event.context.params.id
    const body = await readBody(event)

    if (!body || !body.badgeId) {
      setResponseStatus(event, 400)
      return {
        error: 'Badge ID is required',
      }
    }

    await connectToDB()

    const existingBadge = await UserBadge.findOne({
      user: userId,
      badge: body.badgeId,
    })

    if (existingBadge) {
      setResponseStatus(event, 400)
      return {
        error: 'User already has this badge',
      }
    }

    const badge = await Badge.findById(body.badgeId)
    if (!badge) {
      setResponseStatus(event, 404)
      return {
        error: 'Badge not found',
      }
    }

    const user = await User.findById(userId)
    if (!user) {
      setResponseStatus(event, 404)
      return {
        error: 'User not found',
      }
    }

    const userBadge = new UserBadge({
      user: userId,
      badge: body.badgeId,
      awardedBy: awardingAdmin._id, // Admin who awarded the badge
    })

    await userBadge.save()
    
    // Populate the badge and awardedBy details for response
    await userBadge.populate(['badge', 'awardedBy'])
    
    return { 
      message: 'Badge awarded successfully',
      data: userBadge 
    }

  } catch (error) {
    // If it's an auth error, let it propagate
    if (error.statusCode === 401 || error.statusCode === 403) {
      throw error
    }

    console.error('Error awarding badge:', error)
    setResponseStatus(event, 500)
    return {
      error: 'Internal server error',
    }
  }
})
