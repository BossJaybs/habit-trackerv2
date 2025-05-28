import { NextRequest, NextResponse } from 'next/server'

async function sendEmailWithGmailSMTP(to: string, subject: string, html: string, text: string) {
  return new Promise((resolve, reject) => {
    try {
      const net = require('net')
      const tls = require('tls')
      const crypto = require('crypto')
      
      let socket: any
      let step = 0
      let authenticated = false
      
      socket = net.createConnection(587, 'smtp.gmail.com')
      
      socket.on('connect', () => {
        console.log('📡 Connected to smtp.gmail.com:587')
      })
      
      socket.on('data', (data: Buffer) => {
        const response = data.toString().trim()
        console.log('📨 SMTP:', response)
        
        if (response.startsWith('220') && step === 0) {
          socket.write('EHLO localhost\r\n')
          step = 1
        } else if (response.includes('250') && response.includes('STARTTLS') && step === 1) {
          socket.write('STARTTLS\r\n')
          step = 2
        } else if (response.startsWith('220') && step === 2) {
          console.log('🔐 Starting TLS upgrade...')
          const secureSocket = tls.connect({
            socket: socket,
            servername: 'smtp.gmail.com',
            rejectUnauthorized: false
          })
          
          secureSocket.on('secureConnect', () => {
            console.log('✅ TLS connection established')
            secureSocket.write('EHLO localhost\r\n')
            step = 3
            socket = secureSocket
          })
          
          secureSocket.on('data', (secureData: Buffer) => {
            const secureResponse = secureData.toString().trim()
            console.log('🔒 Secure SMTP:', secureResponse)
            
            if (secureResponse.includes('250') && secureResponse.includes('AUTH') && step === 3) {
              secureSocket.write('AUTH LOGIN\r\n')
              step = 4
            } else if (secureResponse.startsWith('334') && step === 4) {
              const username = Buffer.from(process.env.GMAIL_USER || '').toString('base64')
              secureSocket.write(username + '\r\n')
              step = 5
            } else if (secureResponse.startsWith('334') && step === 5) {
              const password = Buffer.from(process.env.GMAIL_APP_PASSWORD || '').toString('base64')
              secureSocket.write(password + '\r\n')
              step = 6
            } else if (secureResponse.startsWith('235') && step === 6) {
              console.log('✅ Gmail authentication successful')
              authenticated = true
              secureSocket.write(`MAIL FROM:<${process.env.GMAIL_USER}>\r\n`)
              step = 7
            } else if (secureResponse.startsWith('250') && step === 7) {
              secureSocket.write(`RCPT TO:<${to}>\r\n`)
              step = 8
            } else if (secureResponse.startsWith('250') && step === 8) {
              secureSocket.write('DATA\r\n')
              step = 9
            } else if (secureResponse.startsWith('354') && step === 9) {
              const message = [
                `From: "Learning Habit Tracker" <${process.env.GMAIL_USER}>`,
                `To: ${to}`,
                `Subject: ${subject}`,
                `Content-Type: text/html; charset=UTF-8`,
                ``,
                html,
                `.`
              ].join('\r\n') + '\r\n'
              
              secureSocket.write(message)
              step = 10
            } else if (secureResponse.startsWith('250') && step === 10) {
              console.log('✅ Email sent successfully!')
              secureSocket.write('QUIT\r\n')
              const messageId = 'gmail-smtp-' + Date.now()
              resolve({ messageId })
            } else if (secureResponse.startsWith('535') || secureResponse.startsWith('534')) {
              reject(new Error('Gmail authentication failed. Please check your App Password and make sure 2-Step Verification is enabled.'))
            }
          })
          
          secureSocket.on('error', (error: Error) => {
            console.error('🔒 TLS Error:', error)
            reject(new Error(`TLS connection failed: ${error.message}`))
          })
          
        } else if (response.startsWith('535') || response.startsWith('534')) {
          reject(new Error('Gmail authentication failed. Please check your App Password.'))
        }
      })
      
      socket.on('error', (error: Error) => {
        console.error('📡 Connection Error:', error)
        reject(new Error(`SMTP connection failed: ${error.message}`))
      })
      
      socket.on('close', () => {
        console.log('📡 SMTP connection closed')
      })
      
      setTimeout(() => {
        if (!authenticated) {
          socket.destroy()
          reject(new Error('SMTP authentication timeout - please check your credentials'))
        }
      }, 30000)
      
    } catch (error) {
      reject(error)
    }
  })
}

async function testEmailServices(testEmail: string) {
  const results = {
    resend: { configured: false, working: false, error: null as string | null },
    gmail: { configured: false, working: false, error: null as string | null, messageId: null as string | null },
    sendgrid: { configured: false, working: false, error: null as string | null }
  }

  console.log('🔍 Starting enhanced email service tests...')
  console.log(`📧 Testing email delivery to: ${testEmail}`)

  if (process.env.RESEND_API_KEY) {
    results.resend.configured = true
    try {
      console.log('🚀 Testing Resend (recommended)...')
      const { Resend } = await import('resend')
      const resend = new Resend(process.env.RESEND_API_KEY)
      
      await resend.emails.send({
        from: process.env.EMAIL_FROM || 'Learning Habit Tracker <onboarding@resend.dev>',
        to: testEmail,
        subject: '✅ Email Test Successful - Learning Habit Tracker',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
            <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <h1 style="color: #22c55e; margin-bottom: 20px;">🎉 Congratulations!</h1>
              <p style="font-size: 16px; line-height: 1.6; margin-bottom: 15px;">Your Learning Habit Tracker email system is working perfectly!</p>
              
              <div style="background-color: #f0f9ff; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #3b82f6;">
                <h3 style="margin: 0 0 10px 0; color: #1e40af;">✅ What this means:</h3>
                <ul style="margin: 0; padding-left: 20px;">
                  <li>User registration with email verification will work</li>
                  <li>Password reset emails will be delivered</li>
                  <li>All email notifications are functional</li>
                  <li>Your users will have a smooth experience</li>
                </ul>
              </div>
              
              <div style="background-color: #f0fdf4; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #22c55e;">
                <h3 style="margin: 0 0 10px 0; color: #15803d;">🚀 Email Service: Resend</h3>
                <p style="margin: 0; color: #16a34a;">
                  You're using Resend, which is excellent for production applications. 
                  It offers great deliverability and reliability.
                </p>
              </div>
              
              <p style="font-size: 14px; color: #6b7280; margin-top: 30px; text-align: center;">
                This test email was sent from your Learning Habit Tracker application
              </p>
            </div>
          </div>
        `,
        text: `🎉 Congratulations! Your Learning Habit Tracker email system is working perfectly! 

✅ What this means:
- User registration with email verification will work
- Password reset emails will be delivered  
- All email notifications are functional
- Your users will have a smooth experience

🚀 You're using Resend, which is excellent for production applications.

This test email was sent from your Learning Habit Tracker application.`
      })
      
      results.resend.working = true
      console.log('✅ Resend test successful - emails will be delivered reliably!')
    } catch (error) {
      results.resend.error = error.message
      console.error('❌ Resend failed:', error.message)
    }
  }

  if (process.env.SENDGRID_API_KEY) {
    results.sendgrid.configured = true
    try {
      console.log('📬 Testing SendGrid...')
      const sgMail = await import('@sendgrid/mail')
      const sg = sgMail.default || sgMail
      sg.setApiKey(process.env.SENDGRID_API_KEY)
      
      await sg.send({
        to: testEmail,
        from: process.env.EMAIL_FROM || 'noreply@yourdomain.com',
        subject: '✅ SendGrid Test - Learning Habit Tracker',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #10b981;">✅ SendGrid is Working!</h1>
            <p>Your SendGrid email service is configured correctly and ready for production use.</p>
            <div style="background-color: #f0fdf4; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>SendGrid Benefits:</strong></p>
              <ul>
                <li>High-volume email delivery</li>
                <li>Advanced analytics and tracking</li>
                <li>Professional email reputation</li>
              </ul>
            </div>
          </div>
        `,
        text: '✅ SendGrid is working! Your email service is ready for production use.'
      })
      
      results.sendgrid.working = true
      console.log('✅ SendGrid test successful')
    } catch (error) {
      results.sendgrid.error = error.message
      console.error('❌ SendGrid failed:', error.message)
    }
  }

  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    results.gmail.configured = true
    
    try {
      console.log('📧 Testing Gmail SMTP (fixed version)...')
      
      if (process.env.GMAIL_APP_PASSWORD.length !== 16) {
        throw new Error(`Gmail App Password must be exactly 16 characters (current: ${process.env.GMAIL_APP_PASSWORD.length})`)
      }
      
      if (!process.env.GMAIL_USER.includes('@gmail.com')) {
        throw new Error('GMAIL_USER must be a valid Gmail address ending with @gmail.com')
      }
      
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #3b82f6;">✅ Gmail SMTP is Working!</h1>
          <p>Your Gmail SMTP configuration is working correctly!</p>
          
          <div style="background-color: #f0f9ff; padding: 20px; border-radius: 6px; margin: 20px 0;">
            <h3>Configuration Details:</h3>
            <ul>
              <li><strong>Gmail User:</strong> ${process.env.GMAIL_USER}</li>
              <li><strong>App Password:</strong> ✅ Valid (${process.env.GMAIL_APP_PASSWORD.length} characters)</li>
              <li><strong>SMTP Server:</strong> smtp.gmail.com:587 (STARTTLS)</li>
              <li><strong>Authentication:</strong> App Password</li>
            </ul>
          </div>
          
          <div style="background-color: #fef3c7; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>💡 Note:</strong> Gmail SMTP is great for development and small-scale applications. 
            For production apps with high email volume, consider using Resend or SendGrid.</p>
          </div>
          
          <p style="text-align: center; color: #6b7280; font-size: 14px;">
            Sent via Gmail SMTP with STARTTLS encryption
          </p>
        </div>
      `
      
      const info = await sendEmailWithGmailSMTP(
        testEmail,
        '✅ Gmail SMTP Test Successful - Learning Habit Tracker',
        htmlContent,
        '✅ Gmail SMTP is working! Your Gmail SMTP configuration is working correctly.'
      )
      
      results.gmail.working = true
      results.gmail.messageId = info.messageId
      console.log('✅ Gmail SMTP test successful!')
      
    } catch (error) {
      results.gmail.error = error.message
      console.error('❌ Gmail SMTP failed:', error.message)
      
      if (error.message?.includes('authentication failed') || error.message?.includes('535')) {
        console.error('💡 Fix: Generate a new App Password at https://myaccount.google.com/apppasswords')
      } else if (error.message?.includes('16 characters')) {
        console.error('💡 Fix: Your App Password should be exactly 16 characters long')
      } else if (error.message?.includes('@gmail.com')) {
        console.error('💡 Fix: Make sure GMAIL_USER is a valid Gmail address')
      }
    }
  }

  return results
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email address is required' },
        { status: 400 }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    console.log(`\n🧪 Starting comprehensive email test for: ${email}`)
    console.log('='.repeat(60))
    
    const results = await testEmailServices(email)
    
    const report = {
      summary: {
        totalConfigured: Object.values(results).filter(r => r.configured).length,
        totalWorking: Object.values(results).filter(r => r.working).length,
        hasWorkingService: Object.values(results).some(r => r.working)
      },
      services: results,
      recommendations: [] as string[]
    }

    if (!report.summary.hasWorkingService) {
      report.recommendations.push("❌ No working email service found!")
      
      if (results.gmail.configured && !results.gmail.working) {
        const error = results.gmail.error || ''
        
        if (error.includes('authentication failed') || error.includes('App Password')) {
          report.recommendations.push("🔑 Gmail fix: Generate a new 16-character App Password from Google")
        } else if (error.includes('16 characters')) {
          report.recommendations.push("📏 Gmail fix: App Password must be exactly 16 characters long")
        } else if (error.includes('TLS') || error.includes('SSL')) {
          report.recommendations.push("🔐 Gmail fix: TLS connection issue - try restarting your server")
        } else {
          report.recommendations.push("🔧 Gmail error: " + error)
        }
      }
      
      if (!results.resend.configured) {
        report.recommendations.push("💡 Recommended: Set up Resend API key for most reliable email delivery")
      }
      
    } else {
      report.recommendations.push("🎉 Excellent! Your email service is working perfectly!")
      
      if (results.resend.working) {
        report.recommendations.push("🚀 Resend is active - perfect choice for production applications!")
      }
      if (results.gmail.working) {
        report.recommendations.push("📧 Gmail SMTP is working - great for development and personal projects!")
      }
      if (results.sendgrid.working) {
        report.recommendations.push("📬 SendGrid is active - excellent for high-volume email campaigns!")
      }
      
      report.recommendations.push("✅ Your users will be able to receive verification emails successfully!")
    }

    console.log('='.repeat(60))
    console.log(`🏁 Test complete: ${report.summary.totalWorking}/${report.summary.totalConfigured} services working`)
    console.log(`📊 Status: ${report.summary.hasWorkingService ? '✅ SUCCESS' : '❌ NEEDS ATTENTION'}\n`)

    return NextResponse.json({
      success: true,
      report,
      testEmail: email,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Email service test failed:', error)
    return NextResponse.json(
      { 
        error: 'Failed to test email services',
        details: error.message
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  const config = {
    resend: {
      configured: !!process.env.RESEND_API_KEY,
      apiKey: process.env.RESEND_API_KEY ? `${process.env.RESEND_API_KEY.substring(0, 8)}...` : null,
      emailFrom: process.env.EMAIL_FROM || 'Not set (will use default)'
    },
    gmail: {
      configured: !!(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD),
      user: process.env.GMAIL_USER || null,
      hasAppPassword: !!process.env.GMAIL_APP_PASSWORD,
      appPasswordLength: process.env.GMAIL_APP_PASSWORD ? process.env.GMAIL_APP_PASSWORD.length : 0,
      isValidLength: process.env.GMAIL_APP_PASSWORD ? process.env.GMAIL_APP_PASSWORD.length === 16 : false,
      isValidEmail: process.env.GMAIL_USER ? process.env.GMAIL_USER.includes('@gmail.com') : false
    },
    sendgrid: {
      configured: !!process.env.SENDGRID_API_KEY,
      apiKey: process.env.SENDGRID_API_KEY ? `${process.env.SENDGRID_API_KEY.substring(0, 8)}...` : null,
      emailFrom: process.env.EMAIL_FROM || null
    }
  }

  const recommendations = []
  
  if (config.resend.configured) {
    recommendations.push("🚀 Resend is configured - excellent choice for production!")
  } else {
    recommendations.push("💡 Consider Resend: Sign up at resend.com for most reliable email delivery")
  }
  
  if (config.gmail.configured) {
    recommendations.push("📧 Gmail SMTP is configured")
    if (!config.gmail.isValidLength) {
      recommendations.push(`⚠️ Gmail App Password issue: ${config.gmail.appPasswordLength} chars (need 16)`)
    }
    if (!config.gmail.isValidEmail) {
      recommendations.push("⚠️ Gmail user must be a valid @gmail.com address")
    }
  } else {
    recommendations.push("💡 Gmail SMTP: Free option using your existing Gmail account")
  }
  
  if (config.sendgrid.configured) {
    recommendations.push("📬 SendGrid is configured - great for bulk emails")
  } else {
    recommendations.push("💡 SendGrid: Professional email service for high-volume applications")
  }

  const totalConfigured = Object.values(config).filter(service => service.configured).length
  
  if (totalConfigured === 0) {
    recommendations.unshift("⚠️ No email services configured - your app won't be able to send emails!")
  } else {
    recommendations.unshift(`✅ ${totalConfigured} email service(s) configured`)
  }

  return NextResponse.json({
    environment: process.env.NODE_ENV,
    configuration: config,
    recommendations,
    quickStart: {
      easiest: {
        service: "Resend",
        steps: ["Sign up at resend.com", "Get API key", "Add RESEND_API_KEY to .env.local"],
        time: "5 minutes"
      },
      free: {
        service: "Gmail SMTP", 
        steps: ["Enable 2-Step Verification", "Generate App Password", "Add GMAIL_USER and GMAIL_APP_PASSWORD to .env.local"],
        time: "10 minutes"
      }
    },
    timestamp: new Date().toISOString()
  })
}