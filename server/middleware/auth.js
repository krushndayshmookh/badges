import { verifyToken } from '@@/server/utils/auth'
import { connectToDB } from '@@/server/db'
import { User } from '@@/server/models'

export const requireAuth = async (event) => {
  const authHeader = getHeader(event, 'authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    setResponseStatus(event, 401)
    throw createError({
      statusCode: 401,
      statusMessage: 'Access token required'
    })
  }

  const token = authHeader.substring(7) // Remove 'Bearer ' prefix
  const decoded = verifyToken(token)

  if (!decoded) {
    setResponseStatus(event, 401)
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid or expired token'
    })
  }

  try {
    await connectToDB()
    const user = await User.findById(decoded.userId)
    
    if (!user) {
      setResponseStatus(event, 401)
      throw createError({
        statusCode: 401,
        statusMessage: 'User not found'
      })
    }

    // Attach user to event context
    event.context.user = user
    return user

  } catch (error) {
    console.error('Error in auth middleware:', error)
    setResponseStatus(event, 500)
    throw createError({
      statusCode: 500,
      statusMessage: 'Authentication error'
    })
  }
}

export const requireAdmin = async (event) => {
  const user = await requireAuth(event)
  
  if (!user.isAdmin()) {
    setResponseStatus(event, 403)
    throw createError({
      statusCode: 403,
      statusMessage: 'Admin access required'
    })
  }
  
  return user
}

export default defineEventHandler(async () => {
  // This middleware can be used to protect specific routes
  // For now, it just passes through
  // Individual endpoints can call requireAuth() when needed
})