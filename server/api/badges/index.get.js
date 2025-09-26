import { connectToDB } from '@@/server/db'
import { Badge } from '@@/server/models'

export default defineEventHandler(async (event) => {
  try {
    await connectToDB()

    const badges = await Badge.find({})

    return { data: badges }
  } catch (error) {
    console.error('Error fetching badges:', error)
    setResponseStatus(event, 500)
    return {
      error: 'Internal server error',
    }
  }
})
