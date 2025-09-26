import { connectToDB } from '@@/server/db'
import { Badge } from '@@/server/models'
import { requireAdmin } from '@@/server/middleware/auth'

const validationErrors = (body) => {
  const errors = []
  if (!body || !body.name) {
    errors.push('Badge name is required')
  }
  if (!body || !body.description) {
    errors.push('Badge description is required')
  }
  if (!body || !body.imageURL) {
    errors.push('Badge image URL is required')
  }
  return errors.length ? errors : null
}

export default defineEventHandler(async (event) => {
  try {
    // Require admin authentication to create badges
    await requireAdmin(event)
    
    const body = await readBody(event)

    const errors = validationErrors(body)

    if (errors) {
      setResponseStatus(event, 400)
      return {
        error: 'Validation errors',
        details: errors,
      }
    }

    await connectToDB()

    const badge = new Badge({
      name: body.name,
      description: body.description,
      imageURL: body.imageURL,
    })

    await badge.save()

    return { 
      message: 'Badge created successfully',
      data: badge.toObject() 
    }
  } catch (error) {
    // If it's an auth error, let it propagate
    if (error.statusCode === 401 || error.statusCode === 403) {
      throw error
    }

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0]
      setResponseStatus(event, 400)
      return {
        error: `The ${field} is already in use.`,
      }
    }
    
    console.error('Error creating badge:', error)
    setResponseStatus(event, 500)
    return {
      error: 'Internal server error',
    }
  }
})
