
export interface PinVerificationResult {
  success: boolean
  error?: string
  attemptsRemaining?: number
}

export interface EmailVerificationData {
  email: string
  pin: string
  expiresAt: Date
  attempts: number
  maxAttempts: number
  verified: boolean
  createdAt: Date
}

export function generatePin(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export function createEmailVerification(email: string): EmailVerificationData {
  const pin = generatePin()
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000) 
  
  return {
    email: email.toLowerCase(),
    pin,
    expiresAt,
    attempts: 0,
    maxAttempts: 3,
    verified: false,
    createdAt: new Date()
  }
}

export function isValidPinFormat(pin: string): boolean {
  return /^\d{6}$/.test(pin)
}

export function isVerificationExpired(verification: EmailVerificationData): boolean {
  return new Date() > verification.expiresAt
}

export function createPinEmailHtml(pin: string, userFirstName?: string): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification - Learning Habit Tracker</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f7f9fc;
            }
            .container {
                background: #ffffff;
                border-radius: 10px;
                padding: 40px;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            }
            .header {
                text-align: center;
                margin-bottom: 30px;
            }
            .logo {
                font-size: 24px;
                font-weight: bold;
                color: #6366f1;
                margin-bottom: 10px;
            }
            .pin-container {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: #ffffff;
                padding: 20px;
                border-radius: 10px;
                text-align: center;
                margin: 30px 0;
            }
            .pin-code {
                font-size: 36px;
                font-weight: bold;
                letter-spacing: 8px;
                margin: 10px 0;
                font-family: 'Courier New', monospace;
            }
            .warning {
                background-color: #fef3cd;
                border: 1px solid #fecaca;
                border-radius: 5px;
                padding: 15px;
                margin: 20px 0;
                color: #92400e;
            }
            .footer {
                text-align: center;
                margin-top: 40px;
                padding-top: 20px;
                border-top: 1px solid #e5e7eb;
                color: #6b7280;
                font-size: 14px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">📚 Learning Habit Tracker</div>
                <h1>Verify Your Email Address</h1>
            </div>
            
            <p>Hello${userFirstName ? ` ${userFirstName}` : ''},</p>
            
            <p>Thank you for signing up for Learning Habit Tracker! To complete your registration, please use the verification code below:</p>
            
            <div class="pin-container">
                <div>Your verification code is:</div>
                <div class="pin-code">${pin}</div>
                <div>This code will expire in 10 minutes</div>
            </div>
            
            <div class="warning">
                <strong>Security Notice:</strong> Never share this code with anyone. Our team will never ask for this code via phone or email.
            </div>
            
            <p>If you didn't request this verification, please ignore this email or contact our support team.</p>
            
            <div class="footer">
                <p>This email was sent by Learning Habit Tracker</p>
                <p>If you have any questions, please contact our support team.</p>
            </div>
        </div>
    </body>
    </html>
  `
}

export function createPinEmailText(pin: string, userFirstName?: string): string {
  return `
Learning Habit Tracker - Email Verification

Hello${userFirstName ? ` ${userFirstName}` : ''},

Thank you for signing up for Learning Habit Tracker! To complete your registration, please use the verification code below:

VERIFICATION CODE: ${pin}

This code will expire in 10 minutes.

SECURITY NOTICE: Never share this code with anyone. Our team will never ask for this code via phone or email.

If you didn't request this verification, please ignore this email or contact our support team.

---
Learning Habit Tracker
  `
}