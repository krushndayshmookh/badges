import { connectToDB } from '@@/server/db'
import { User } from '@@/server/models'
import { requireAuth } from '@@/server/middleware/auth'

export default defineEventHandler(async (event) => {
  try {
    // Require authentication - users can only view their own profile
    const user = await requireAuth(event)
    
    await connectToDB()

    // Get full user profile with badge count
    const userProfile = await User.aggregate([
      { $match: { _id: user._id } },
      {
        $lookup: {
          from: 'userbadges',
          localField: '_id',
          foreignField: 'user',
          as: 'userBadges'
        }
      },
      {
        $addFields: {
          badgeCount: { $size: '$userBadges' }
        }
      },
      {
        $project: {
          password: 0,
          userBadges: 0,
          __v: 0
        }
      }
    ])

    if (!userProfile.length) {
      setResponseStatus(event, 404)
      return {
        error: 'User not found'
      }
    }

    return {
      data: userProfile[0]
    }

  } catch (error) {
    // If it's an auth error, let it propagate
    if (error.statusCode === 401 || error.statusCode === 403) {
      throw error
    }

    console.error('Error fetching user profile:', error)
    setResponseStatus(event, 500)
    return {
      error: 'Internal server error',
    }
  }
})