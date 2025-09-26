import { connectToDB } from '@@/server/db'
import { User } from '@@/server/models'

export default defineEventHandler(async (event) => {
  try {
    await connectToDB()

    const query = getQuery(event)
    const page = parseInt(query.page) || 1
    const limit = Math.min(parseInt(query.limit) || 20, 50) // Max 50 per page
    const search = query.search || ''

    const skip = (page - 1) * limit

    // Build filter
    const filter = {}
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { githubUsername: { $regex: search, $options: 'i' } }
      ]
    }

    // Get users with badge counts
    const users = await User.aggregate([
      { $match: filter },
      {
        $lookup: {
          from: 'userbadges',
          localField: '_id',
          foreignField: 'user',
          as: 'badges'
        }
      },
      {
        $addFields: {
          badgeCount: { $size: '$badges' }
        }
      },
      {
        $project: {
          firstName: 1,
          lastName: 1,
          githubUsername: 1,
          socialLinks: 1,
          badgeCount: 1,
          createdAt: 1,
          fullName: { $concat: ['$firstName', { $ifNull: [{ $concat: [' ', '$lastName'] }, ''] }] },
          githubAvatarUrl: { $concat: ['https://avatars.githubusercontent.com/', '$githubUsername'] }
        }
      },
      { $sort: { badgeCount: -1, createdAt: -1 } },
      { $skip: skip },
      { $limit: limit }
    ])

    const total = await User.countDocuments(filter)

    return {
      data: users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }

  } catch (error) {
    console.error('Error fetching public users:', error)
    setResponseStatus(event, 500)
    return {
      error: 'Internal server error'
    }
  }
})