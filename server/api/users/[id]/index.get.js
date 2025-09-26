import { connectToDB } from '@@/server/db'
import { User } from '@@/server/models'

export default defineEventHandler(async (event) => {
  const userId = event.context.params.id

  try {
    await connectToDB()

    const user = await User.findById(userId)

    if (!user) {
      setResponseStatus(event, 404)
      return {
        error: 'User not found',
      }
    }

    return { data: user }
  } catch (error) {
    console.error('Error fetching user:', error)
    setResponseStatus(event, 500)
    return {
      error: 'Internal server error',
    }
  }
})
