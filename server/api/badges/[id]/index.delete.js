import { connectToDB } from '@@/server/db'
import { Badge, UserBadge, UserBadgeRequest } from '@@/server/models'
import { requireAdmin } from '@@/server/middleware/auth'

export default defineEventHandler(async (event) => {
  try {
    // Require admin authentication to delete badges
    await requireAdmin(event)
    
    const badgeId = getRouterParam(event, 'id')

    if (!badgeId) {
      setResponseStatus(event, 400)
      return {
        error: 'Badge ID is required'
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

    // Check if badge is in use (has been awarded to users)
    const badgeUsageCount = await UserBadge.countDocuments({ badge: badgeId })
    const requestCount = await UserBadgeRequest.countDocuments({ badge: badgeId })

    if (badgeUsageCount > 0 || requestCount > 0) {
      setResponseStatus(event, 400)
      return {
        error: 'Cannot delete badge that has been awarded to users or has pending requests',
        details: {
          usersWithBadge: badgeUsageCount,
          pendingRequests: requestCount
        }
      }
    }

    // Safe to delete
    await Badge.findByIdAndDelete(badgeId)

    return {
      message: 'Badge deleted successfully',
      data: { deletedBadge: badge }
    }

  } catch (error) {
    // If it's an auth error, let it propagate
    if (error.statusCode === 401 || error.statusCode === 403) {
      throw error
    }

    console.error('Error deleting badge:', error)
    setResponseStatus(event, 500)
    return {
      error: 'Internal server error'
    }
  }
})