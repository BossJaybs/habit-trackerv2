
export interface EmailValidationResult {
  isValid: boolean
  isGmail: boolean
  exists?: boolean
  error?: string
  suggestion?: string
}

export function validateEmailFormat(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function isGmailAddress(email: string): boolean {
  const gmailDomains = [
    'gmail.com',
    'googlemail.com'
  ]
  
  const domain = email.toLowerCase().split('@')[1]
  return gmailDomains.includes(domain)
}

export function validateGmailAddress(email: string): EmailValidationResult {
  const result: EmailValidationResult = {
    isValid: false,
    isGmail: false
  }

  if (!validateEmailFormat(email)) {
    result.error = "Invalid email format"
    return result
  }

  result.isValid = true
  result.isGmail = isGmailAddress(email)

  if (result.isGmail) {
    const [localPart, domain] = email.toLowerCase().split('@')
    
    if (localPart.length < 1) {
      result.isValid = false
      result.error = "Gmail username cannot be empty"
      return result
    }

    if (localPart.length > 30) {
      result.isValid = false
      result.error = "Gmail username is too long (max 30 characters)"
      return result
    }

    const validGmailRegex = /^[a-z0-9.]+$/
    if (!validGmailRegex.test(localPart)) {
      result.isValid = false
      result.error = "Gmail addresses can only contain letters, numbers, and periods"
      return result
    }

    if (localPart.includes('..')) {
      result.isValid = false
      result.error = "Gmail addresses cannot have consecutive periods"
      return result
    }

    if (localPart.startsWith('.') || localPart.endsWith('.')) {
      result.isValid = false
      result.error = "Gmail addresses cannot start or end with a period"
      return result
    }
  }

  return result
}

export async function serverValidateEmail(email: string): Promise<EmailValidationResult> {
  const result = validateGmailAddress(email)
  
  if (!result.isValid) {
    return result
  }

  try {
    if (result.isGmail) {
      const [localPart] = email.toLowerCase().split('@')
      
      const normalizedLocal = localPart.replace(/\./g, '')
      
      if (normalizedLocal.length < 3) {
        result.error = "Gmail address appears to be too short"
        result.isValid = false
        return result
      }

    }

    result.exists = true
    return result
  } catch (error) {
    result.error = "Unable to verify email existence"
    return result
  }
}

export function suggestEmailCorrection(email: string): string | null {
  const commonTypos = {
    'gamil.com': 'gmail.com',
    'gmai.com': 'gmail.com',
    'gmial.com': 'gmail.com',
    'gmail.co': 'gmail.com',
    'g-mail.com': 'gmail.com',
    'googlemai.com': 'googlemail.com',
    'googemail.com': 'googlemail.com'
  }

  const [localPart, domain] = email.toLowerCase().split('@')
  
  if (commonTypos[domain]) {
    return `${localPart}@${commonTypos[domain]}`
  }

  return null
}