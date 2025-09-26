import { connectToDB } from '@@/server/db'
import { User } from '@@/server/models'
import { requireAdmin } from '@@/server/middleware/auth'

export default defineEventHandler(async (event) => {
  try {
    // Require admin authentication to list all users
    await requireAdmin(event)
    
    await connectToDB()

    const query = getQuery(event)
    const page = parseInt(query.page) || 1
    const limit = Math.min(parseInt(query.limit) || 20, 100) // Max 100 per page
    const search = query.search || ''
    const role = query.role || ''

    const skip = (page - 1) * limit

    // Build filter
    const filter = {}
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { githubUsername: { $regex: search, $options: 'i' } }
      ]
    }
    if (role && ['base', 'admin'].includes(role)) {
      filter.role = role
    }

    const users = await User.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)

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
    // If it's an auth error, let it propagate
    if (error.statusCode === 401 || error.statusCode === 403) {
      throw error
    }

    console.error('Error fetching users:', error)
    setResponseStatus(event, 500)
    return {
      error: 'Internal server error',
    }
  }
})
