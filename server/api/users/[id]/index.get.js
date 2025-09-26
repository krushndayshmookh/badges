import { connectToDB } from '@@/server/db'
import { User } from '@@/server/models'
import { validateObjectId } from '@@/server/utils/sanitization'

export default defineEventHandler(async (event) => {
  const userId = event.context.params.id

  if (!validateObjectId(userId)) {
    setResponseStatus(event, 400)
    return {
      error: 'Invalid user ID format'
    }
  }

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
