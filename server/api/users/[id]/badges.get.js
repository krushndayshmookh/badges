import { connectToDB } from '@@/server/db'
import { UserBadge } from '@@/server/models'

export default defineEventHandler(async (event) => {
  const userId = event.context.params.id

  try {
    await connectToDB()
    const badges = await UserBadge.find({
      user: userId,
    }).populate(['badge', 'awardedBy'])

    return { data: badges }
  } catch (error) {
    console.error('Error fetching user badges:', error)
    setResponseStatus(event, 500)
    return {
      error: 'Internal server error',
    }
  }
})
