import { connectToDB } from '@@/server/db'
import { Badge } from '@@/server/models'

export default defineEventHandler(async (event) => {
  try {
    await connectToDB()

    const query = getQuery(event)
    const page = parseInt(query.page) || 1
    const limit = Math.min(parseInt(query.limit) || 50, 100) // Max 100 per page
    const search = query.search || ''

    const skip = (page - 1) * limit

    // Build filter
    const filter = {}
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ]
    }

    const badges = await Badge.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)

    const total = await Badge.countDocuments(filter)

    return { 
      data: badges,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  } catch (error) {
    console.error('Error fetching badges:', error)
    setResponseStatus(event, 500)
    return {
      error: 'Internal server error',
    }
  }
})
