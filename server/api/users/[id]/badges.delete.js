import { connectToDB } from '@@/server/db'
import { UserBadge } from '@@/server/models'
import { requireAdmin } from '@@/server/middleware/auth'

export default defineEventHandler(async (event) => {
  try {
    // Require admin authentication to revoke badges
    await requireAdmin(event)
    
    const userId = getRouterParam(event, 'id')
    const body = await readBody(event)

    if (!userId) {
      setResponseStatus(event, 400)
      return {
        error: 'User ID is required'
      }
    }

    if (!body || !body.badgeId) {
      setResponseStatus(event, 400)
      return {
        error: 'Badge ID is required'
      }
    }

    await connectToDB()

    // Find the user badge
    const userBadge = await UserBadge.findOne({
      user: userId,
      badge: body.badgeId
    }).populate(['user', 'badge'])

    if (!userBadge) {
      setResponseStatus(event, 404)
      return {
        error: 'User does not have this badge'
      }
    }

    // Remove the badge
    await UserBadge.findByIdAndDelete(userBadge._id)

    return {
      message: 'Badge revoked successfully',
      data: {
        revokedBadge: userBadge
      }
    }

  } catch (error) {
    // If it's an auth error, let it propagate
    if (error.statusCode === 401 || error.statusCode === 403) {
      throw error
    }

    console.error('Error revoking badge:', error)
    setResponseStatus(event, 500)
    return {
      error: 'Internal server error'
    }
  }
})