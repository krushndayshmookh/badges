import { connectToDB } from '@@/server/db'
import { Badge } from '@@/server/models'

export default defineEventHandler(async (event) => {
  const badgeId = getRouterParam(event, 'id')

  if (!badgeId) {
    setResponseStatus(event, 400)
    return {
      error: 'Badge ID is required'
    }
  }

  try {
    await connectToDB()

    const badge = await Badge.findById(badgeId)

    if (!badge) {
      setResponseStatus(event, 404)
      return {
        error: 'Badge not found'
      }
    }

    return { data: badge }
  } catch (error) {
    console.error('Error fetching badge:', error)
    setResponseStatus(event, 500)
    return {
      error: 'Internal server error'
    }
  }
})