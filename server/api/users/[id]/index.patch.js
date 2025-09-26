import { requireAdmin } from '@@/server/middleware/auth'
import { connectToDB } from '@@/server/db'
import { User } from '@@/server/models'

const validationErrors = (details) => {
  const { role } = details
  const errors = []

  if (!role) {
    errors.push('Role is required')
  } else if (!['base', 'admin'].includes(role)) {
    errors.push('Role must be either "base" or "admin"')
  }

  return errors.length ? errors : null
}

export default defineEventHandler(async (event) => {
  try {
    // Require admin authentication
    const adminUser = await requireAdmin(event)
    
    const userId = getRouterParam(event, 'id')
    const body = await readBody(event)

    if (!userId) {
      setResponseStatus(event, 400)
      return {
        error: 'User ID is required'
      }
    }

    const errors = validationErrors(body)
    if (errors) {
      setResponseStatus(event, 400)
      return {
        error: 'Validation errors',
        details: errors
      }
    }

    await connectToDB()

    // Find the target user
    const targetUser = await User.findById(userId)
    if (!targetUser) {
      setResponseStatus(event, 404)
      return {
        error: 'User not found'
      }
    }

    // Prevent self-demotion from admin
    if (adminUser._id.toString() === userId && body.role === 'base') {
      setResponseStatus(event, 400)
      return {
        error: 'You cannot demote yourself from admin'
      }
    }

    // Update the user's role
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { role: body.role },
      { new: true, runValidators: true }
    )

    return {
      message: `User role updated to ${body.role}`,
      data: updatedUser
    }

  } catch (error) {
    // If it's an auth error, let it propagate
    if (error.statusCode === 401 || error.statusCode === 403) {
      throw error
    }

    console.error('Error updating user role:', error)
    setResponseStatus(event, 500)
    return {
      error: 'Internal server error. Please try again later.'
    }
  }
})