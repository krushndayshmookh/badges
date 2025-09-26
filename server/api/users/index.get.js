import { connectToDB } from '@@/server/db'
import { User } from '@@/server/models'
import { requireAdmin } from '@@/server/middleware/auth'

export default defineEventHandler(async (event) => {
  try {
    // Require admin authentication to list all users
    await requireAdmin(event)
    
    await connectToDB()

    const users = await User.find().sort({ createdAt: -1 })

    return { data: users }
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
