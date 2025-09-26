import { connectToDB } from '@@/server/db'
import { Badge, UserBadge, UserBadgeRequest } from '@@/server/models'
import { requireAdmin } from '@@/server/middleware/auth'

export default defineEventHandler(async (event) => {
  try {
    // Require admin authentication to view statistics
    await requireAdmin(event)
    
    await connectToDB()

    // Get basic counts
    const totalBadges = await Badge.countDocuments()
    const totalUserBadges = await UserBadge.countDocuments()
    const pendingRequests = await UserBadgeRequest.countDocuments({ status: 'pending' })
    const approvedRequests = await UserBadgeRequest.countDocuments({ status: 'approved' })
    const rejectedRequests = await UserBadgeRequest.countDocuments({ status: 'rejected' })

    // Get most popular badges
    const popularBadges = await UserBadge.aggregate([
      {
        $group: {
          _id: '$badge',
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'badges',
          localField: '_id',
          foreignField: '_id',
          as: 'badge'
        }
      },
      {
        $unwind: '$badge'
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 10
      },
      {
        $project: {
          _id: 0,
          badge: '$badge',
          awardedCount: '$count'
        }
      }
    ])

    // Get badges never awarded
    const awardedBadgeIds = await UserBadge.distinct('badge')
    const neverAwardedBadges = await Badge.find({
      _id: { $nin: awardedBadgeIds }
    }).select('name description imageURL')

    return {
      data: {
        overview: {
          totalBadges,
          totalUserBadges,
          pendingRequests,
          approvedRequests,
          rejectedRequests
        },
        popularBadges,
        neverAwardedBadges
      }
    }

  } catch (error) {
    // If it's an auth error, let it propagate
    if (error.statusCode === 401 || error.statusCode === 403) {
      throw error
    }

    console.error('Error fetching badge statistics:', error)
    setResponseStatus(event, 500)
    return {
      error: 'Internal server error'
    }
  }
})