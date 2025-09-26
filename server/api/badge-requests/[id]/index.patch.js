import { connectToDB } from '@@/server/db'
import { UserBadgeRequest, UserBadge } from '@@/server/models'
import { requireAdmin } from '@@/server/middleware/auth'

const validationErrors = (details) => {
  const { action } = details
  const errors = []

  if (!action) {
    errors.push('Action is required')
  } else if (!['approve', 'reject'].includes(action)) {
    errors.push('Action must be either "approve" or "reject"')
  }

  return errors.length ? errors : null
}

export default defineEventHandler(async (event) => {
  try {
    // Require admin authentication to review badge requests
    const reviewingAdmin = await requireAdmin(event)
    
    const requestId = getRouterParam(event, 'id')
    const body = await readBody(event)

    if (!requestId) {
      setResponseStatus(event, 400)
      return {
        error: 'Request ID is required'
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

    // Find the badge request
    const badgeRequest = await UserBadgeRequest.findById(requestId)
      .populate(['user', 'badge'])

    if (!badgeRequest) {
      setResponseStatus(event, 404)
      return {
        error: 'Badge request not found'
      }
    }

    // Check if request is still pending
    if (badgeRequest.status !== 'pending') {
      setResponseStatus(event, 400)
      return {
        error: `Request has already been ${badgeRequest.status}`
      }
    }

    if (body.action === 'approve') {
      // Check if user already has this badge
      const existingBadge = await UserBadge.findOne({
        user: badgeRequest.user._id,
        badge: badgeRequest.badge._id,
      })

      if (existingBadge) {
        setResponseStatus(event, 400)
        return {
          error: 'User already has this badge'
        }
      }

      // Create the user badge
      const userBadge = new UserBadge({
        user: badgeRequest.user._id,
        badge: badgeRequest.badge._id,
        awardedBy: reviewingAdmin._id,
        userBadgeRequest: badgeRequest._id,
      })

      await userBadge.save()

      // Update request status
      badgeRequest.status = 'approved'
      badgeRequest.reviewedAt = new Date()
      badgeRequest.reviewedBy = reviewingAdmin._id
      badgeRequest.userBadge = userBadge._id
      await badgeRequest.save()

      await badgeRequest.populate('reviewedBy')

      return {
        message: 'Badge request approved and badge awarded',
        data: {
          request: badgeRequest,
          userBadge: userBadge
        }
      }

    } else if (body.action === 'reject') {
      // Update request status
      badgeRequest.status = 'rejected'
      badgeRequest.reviewedAt = new Date()
      badgeRequest.reviewedBy = reviewingAdmin._id
      await badgeRequest.save()

      await badgeRequest.populate('reviewedBy')

      return {
        message: 'Badge request rejected',
        data: badgeRequest
      }
    }

  } catch (error) {
    // If it's an auth error, let it propagate
    if (error.statusCode === 401 || error.statusCode === 403) {
      throw error
    }

    console.error('Error reviewing badge request:', error)
    setResponseStatus(event, 500)
    return {
      error: 'Internal server error',
    }
  }
})