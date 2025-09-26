/**
 * Utility functions for input sanitization and validation
 */

export const sanitizeString = (str, maxLength = 255) => {
  if (typeof str !== 'string') return ''
  return str.trim().slice(0, maxLength)
}

export const sanitizeEmail = (email) => {
  if (typeof email !== 'string') return ''
  return email.toLowerCase().trim()
}

export const sanitizeUrl = (url) => {
  if (typeof url !== 'string') return ''
  const trimmed = url.trim()
  
  // Add protocol if missing
  if (trimmed && !trimmed.match(/^https?:\/\//)) {
    return `https://${trimmed}`
  }
  
  return trimmed
}

export const validateObjectId = (id) => {
  return /^[0-9a-fA-F]{24}$/.test(id)
}

export const sanitizeObject = (obj, allowedFields) => {
  const sanitized = {}
  
  for (const field of allowedFields) {
    if (obj && Object.prototype.hasOwnProperty.call(obj, field)) {
      sanitized[field] = obj[field]
    }
  }
  
  return sanitized
}