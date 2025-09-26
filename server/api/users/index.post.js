import { connectToDB } from '@@/server/db'
import { User } from '@@/server/models'

const validationErrors = (details) => {
  const { firstName, githubUsername, email, password } = details

  const errors = []
  if (!firstName) {
    errors.push('First name is required')
  }

  // lastName is optional

  if (!githubUsername) {
    errors.push('GitHub username is required')
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  if (!email || !emailRegex.test(email)) {
    errors.push('Invalid email format')
  }

  if (!password || password.length < 6) {
    errors.push('Password must be at least 6 characters long')
  }

  return errors.length ? errors : null
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const errors = validationErrors(body)

  if (errors) {
    setResponseStatus(event, 400)

    return {
      error: 'Validation errors',
      details: errors,
    }
  }

  try {
    await connectToDB()

    const user = new User({
      firstName: body.firstName,
      lastName: body.lastName || '',
      githubUsername: body.githubUsername,
      email: body.email,
      password: body.password,
    })

    await user.save()

    return { data: user.toObject() }
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0]

      setResponseStatus(event, 400)
      return {
        error: `The ${field} is already in use.`,
      }
    }
    console.error('Error creating user:', error)

    setResponseStatus(event, 500)
    return {
      error: 'Internal server error',
    }
  }
})
