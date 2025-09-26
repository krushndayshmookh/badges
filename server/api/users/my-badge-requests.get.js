import { connectToDB } from '@@/server/db'
import { UserBadgeRequest } from '@@/server/models'
import { requireAuth } from '@@/server/middleware/auth'

export default defineEventHandler(async (event) => {
  try {
    // Require authentication - users can only view their own requests
    const user = await requireAuth(event)
    
    await connectToDB()

    const query = getQuery(event)
    const status = query.status // Optional filter by status
    const page = parseInt(query.page) || 1
    const limit = parseInt(query.limit) || 20

    const skip = (page - 1) * limit

    // Build filter for user's requests
    const filter = { user: user._id }
    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      filter.status = status
    }

    const requests = await UserBadgeRequest.find(filter)
      .populate(['badge', 'reviewedBy', 'userBadge'])
      .sort({ requestedAt: -1 })
      .skip(skip)
      .limit(limit)

    const total = await UserBadgeRequest.countDocuments(filter)

    return {
      data: requests,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }

  } catch (error) {
    // If it's an auth error, let it propagate
    if (error.statusCode === 401 || error.statusCode === 403) {
      throw error
    }

    console.error('Error fetching user badge requests:', error)
    setResponseStatus(event, 500)
    return {
      error: 'Internal server error',
    }
  }
})