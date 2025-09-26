import { requireAuth } from '@@/server/middleware/auth'

export default defineEventHandler(async (event) => {
  // Require authentication
  try {
    const user = await requireAuth(event)
    return {
      data: user,
    }
  } catch (error) {
    console.error('Authentication error:', error)
    setResponseStatus(event, 401)
    return { error: 'Unauthorized', details: error.message }
  }
})
