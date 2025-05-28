// app/test-email/page.tsx
"use client"

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, AlertCircle, Mail, Settings, Send, RefreshCw, ExternalLink, Copy } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

interface EmailServiceResult {
  configured: boolean
  working: boolean
  error?: string
  messageId?: string
}

interface TestResults {
  resend: EmailServiceResult
  gmail: EmailServiceResult  
  sendgrid: EmailServiceResult
}

interface ConfigStatus {
  resend: {
    configured: boolean
    apiKey: string | null
    emailFrom: string | null
  }
  gmail: {
    configured: boolean
    user: string | null
    hasAppPassword: boolean
    appPasswordLength: number
  }
  sendgrid: {
    configured: boolean
    apiKey: string | null
    emailFrom: string | null
  }
}

interface ReportData {
  summary: {
    totalConfigured: number
    totalWorking: number
    hasWorkingService: boolean
  }
  services: TestResults
  recommendations: string[]
}

export default function EmailTestPage() {
  const [testEmail, setTestEmail] = useState('')
  const [isTestingConfig, setIsTestingConfig] = useState(false)
  const [isSendingTest, setIsSendingTest] = useState(false)
  const [configStatus, setConfigStatus] = useState<ConfigStatus | null>(null)
  const [testResults, setTestResults] = useState<TestResults | null>(null)
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const { toast } = useToast()

  // Load configuration status on component mount
  useEffect(() => {
    loadConfigStatus()
  }, [])

  const loadConfigStatus = async () => {
    setIsTestingConfig(true)
    setError(null)
    
    try {
      const response = await fetch('/api/test-email')
      const data = await response.json()
      
      if (response.ok) {
        setConfigStatus(data.configuration)
        setSuccess('Configuration loaded successfully')
      } else {
        setError(data.error || 'Failed to load configuration')
      }
    } catch (err) {
      setError('Failed to connect to test endpoint. Make sure your server is running.')
    } finally {
      setIsTestingConfig(false)
    }
  }

  const sendTestEmail = async () => {
    if (!testEmail) {
      setError('Please enter an email address')
      return
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(testEmail)) {
      setError('Please enter a valid email address')
      return
    }

    setIsSendingTest(true)
    setError(null)
    setSuccess(null)
    setTestResults(null)
    setReportData(null)

    try {
      const response = await fetch('/api/test-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: testEmail }),
      })

      const data = await response.json()

      if (response.ok) {
        setTestResults(data.report.services)
        setReportData(data.report)
        
        if (data.report.summary.hasWorkingService) {
          setSuccess(`✅ Test emails sent to ${testEmail}! Check your inbox.`)
          toast({
            title: "Test Complete",
            description: "At least one email service is working!",
          })
        } else {
          setError('❌ All email services failed. Check the results below.')
        }
      } else {
        setError(data.error || 'Test failed')
      }
    } catch (err) {
      setError('Failed to send test email. Check your server connection.')
    } finally {
      setIsSendingTest(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied!",
      description: "Text copied to clipboard",
    })
  }

  const getServiceIcon = (service: EmailServiceResult) => {
    if (!service.configured) return <Settings className="h-4 w-4 text-gray-400" />
    if (service.working) return <CheckCircle className="h-4 w-4 text-green-500" />
    return <XCircle className="h-4 w-4 text-red-500" />
  }

  const getServiceStatus = (service: EmailServiceResult) => {
    if (!service.configured) return { text: 'Not Configured', variant: 'secondary' as const }
    if (service.working) return { text: 'Working ✅', variant: 'default' as const }
    return { text: 'Failed ❌', variant: 'destructive' as const }
  }

  const getServiceColor = (service: EmailServiceResult) => {
    if (!service.configured) return 'border-gray-200 bg-gray-50'
    if (service.working) return 'border-green-200 bg-green-50'
    return 'border-red-200 bg-red-50'
  }

  return (
    <div className="container mx-auto py-8 max-w-6xl px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          📧 Email Service Test Center
        </h1>
        <p className="text-lg text-gray-600 mb-4">
          Test and debug your email configuration for the Learning Habit Tracker
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadConfigStatus}
            disabled={isTestingConfig}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isTestingConfig ? 'animate-spin' : ''}`} />
            Refresh Config
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open('https://myaccount.google.com/apppasswords', '_blank')}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Gmail App Passwords
          </Button>
        </div>
      </div>

      {/* Global Messages */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-6 border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <AlertDescription className="text-green-700">{success}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Configuration Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Current Configuration
              </CardTitle>
              <CardDescription>
                Shows which email services are configured in your environment
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isTestingConfig ? (
                <div className="flex items-center gap-2 py-8 justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                  <span>Loading configuration...</span>
                </div>
              ) : configStatus ? (
                <div className="space-y-4">
                  {/* Gmail Configuration */}
                  <div className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${
                    configStatus.gmail.configured ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-gray-50'
                  }`}>
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-blue-500" />
                      <div>
                        <div className="font-medium">Gmail SMTP</div>
                        <div className="text-sm text-gray-600">
                          {configStatus.gmail.user || 'Not configured'}
                        </div>
                        {configStatus.gmail.configured && (
                          <div className="text-xs text-gray-500">
                            App Password: {configStatus.gmail.appPasswordLength} chars
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge variant={configStatus.gmail.configured ? 'default' : 'secondary'}>
                        {configStatus.gmail.configured ? 'Configured' : 'Not Configured'}
                      </Badge>
                      {configStatus.gmail.configured && (
                        <Badge variant={configStatus.gmail.appPasswordLength === 16 ? 'default' : 'destructive'}>
                          {configStatus.gmail.appPasswordLength === 16 ? 'Valid Length' : 'Invalid Length'}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Resend Configuration */}
                  <div className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${
                    configStatus.resend.configured ? 'border-purple-200 bg-purple-50' : 'border-gray-200 bg-gray-50'
                  }`}>
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-purple-500" />
                      <div>
                        <div className="font-medium">Resend</div>
                        <div className="text-sm text-gray-600">
                          {configStatus.resend.apiKey || 'Not configured'}
                        </div>
                        {configStatus.resend.emailFrom && (
                          <div className="text-xs text-gray-500">
                            From: {configStatus.resend.emailFrom}
                          </div>
                        )}
                      </div>
                    </div>
                    <Badge variant={configStatus.resend.configured ? 'default' : 'secondary'}>
                      {configStatus.resend.configured ? 'Configured' : 'Not Configured'}
                    </Badge>
                  </div>

                  {/* SendGrid Configuration */}
                  <div className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${
                    configStatus.sendgrid.configured ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'
                  }`}>
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-green-500" />
                      <div>
                        <div className="font-medium">SendGrid</div>
                        <div className="text-sm text-gray-600">
                          {configStatus.sendgrid.apiKey || 'Not configured'}
                        </div>
                        {configStatus.sendgrid.emailFrom && (
                          <div className="text-xs text-gray-500">
                            From: {configStatus.sendgrid.emailFrom}
                          </div>
                        )}
                      </div>
                    </div>
                    <Badge variant={configStatus.sendgrid.configured ? 'default' : 'secondary'}>
                      {configStatus.sendgrid.configured ? 'Configured' : 'Not Configured'}
                    </Badge>
                  </div>

                  {/* Configuration Summary */}
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="text-sm">
                      <strong>Configuration Summary:</strong>
                      <div className="mt-1">
                        {Object.values(configStatus).filter(service => service.configured).length > 0 ? (
                          <span className="text-green-600">
                            ✅ {Object.values(configStatus).filter(service => service.configured).length} service(s) configured
                          </span>
                        ) : (
                          <span className="text-red-600">
                            ❌ No email services configured
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-red-500 py-4 text-center">
                  Failed to load configuration
                </div>
              )}
            </CardContent>
          </Card>

          {/* Test Email Sending */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Send Test Email
              </CardTitle>
              <CardDescription>
                Send a test email to verify your email services are working
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <Input
                    type="email"
                    placeholder="Enter your email address (e.g., your-email@gmail.com)"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    className="flex-1"
                    onKeyPress={(e) => e.key === 'Enter' && sendTestEmail()}
                  />
                  <Button 
                    onClick={sendTestEmail} 
                    disabled={isSendingTest || !testEmail}
                    className="min-w-[120px]"
                  >
                    {isSendingTest ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Testing...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send Test
                      </>
                    )}
                  </Button>
                </div>

                <div className="text-sm text-gray-600 p-3 bg-gray-50 rounded-lg">
                  <strong>What this test does:</strong>
                  <ul className="list-disc pl-5 mt-1 space-y-1">
                    <li>Tests all configured email services</li>
                    <li>Sends actual test emails to your address</li>
                    <li>Shows detailed error messages if something fails</li>
                    <li>Verifies SMTP connections before sending</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Test Results */}
          {testResults && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Test Results</span>
                  {reportData && (
                    <Badge variant={reportData.summary.hasWorkingService ? 'default' : 'destructive'}>
                      {reportData.summary.totalWorking}/{reportData.summary.totalConfigured} Working
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  Results from testing each configured email service
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Gmail Results */}
                  <div className={`p-4 border rounded-lg transition-colors ${getServiceColor(testResults.gmail)}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        {getServiceIcon(testResults.gmail)}
                        <div className="flex-1">
                          <div className="font-medium flex items-center gap-2">
                            Gmail SMTP
                            <Badge variant={getServiceStatus(testResults.gmail).variant} className="text-xs">
                              {getServiceStatus(testResults.gmail).text}
                            </Badge>
                          </div>
                          {testResults.gmail.error && (
                            <div className="text-sm text-red-600 mt-1 p-2 bg-red-50 rounded border">
                              <strong>Error:</strong> {testResults.gmail.error}
                            </div>
                          )}
                          {testResults.gmail.messageId && (
                            <div className="text-sm text-green-600 mt-1 p-2 bg-green-50 rounded border">
                              <strong>Success!</strong> Message ID: 
                              <code className="ml-1 text-xs bg-white px-1 rounded">
                                {testResults.gmail.messageId}
                              </code>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="ml-2 h-6 w-6 p-0"
                                onClick={() => copyToClipboard(testResults.gmail.messageId!)}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Resend Results */}
                  <div className={`p-4 border rounded-lg transition-colors ${getServiceColor(testResults.resend)}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        {getServiceIcon(testResults.resend)}
                        <div className="flex-1">
                          <div className="font-medium flex items-center gap-2">
                            Resend
                            <Badge variant={getServiceStatus(testResults.resend).variant} className="text-xs">
                              {getServiceStatus(testResults.resend).text}
                            </Badge>
                          </div>
                          {testResults.resend.error && (
                            <div className="text-sm text-red-600 mt-1 p-2 bg-red-50 rounded border">
                              <strong>Error:</strong> {testResults.resend.error}
                            </div>
                          )}
                          {testResults.resend.working && (
                            <div className="text-sm text-green-600 mt-1 p-2 bg-green-50 rounded border">
                              <strong>Success!</strong> Email sent via Resend
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SendGrid Results */}
                  <div className={`p-4 border rounded-lg transition-colors ${getServiceColor(testResults.sendgrid)}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        {getServiceIcon(testResults.sendgrid)}
                        <div className="flex-1">
                          <div className="font-medium flex items-center gap-2">
                            SendGrid
                            <Badge variant={getServiceStatus(testResults.sendgrid).variant} className="text-xs">
                              {getServiceStatus(testResults.sendgrid).text}
                            </Badge>
                          </div>
                          {testResults.sendgrid.error && (
                            <div className="text-sm text-red-600 mt-1 p-2 bg-red-50 rounded border">
                              <strong>Error:</strong> {testResults.sendgrid.error}
                            </div>
                          )}
                          {testResults.sendgrid.working && (
                            <div className="text-sm text-green-600 mt-1 p-2 bg-green-50 rounded border">
                              <strong>Success!</strong> Email sent via SendGrid
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Summary & Recommendations */}
                {reportData && (
                  <div className="mt-6 space-y-4">
                    <div className={`p-4 rounded-lg border ${
                      reportData.summary.hasWorkingService 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-red-50 border-red-200'
                    }`}>
                      <h4 className="font-medium mb-2">
                        {reportData.summary.hasWorkingService ? '✅ Test Summary' : '❌ Test Summary'}
                      </h4>
                      <div className={`text-sm ${
                        reportData.summary.hasWorkingService ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {reportData.summary.hasWorkingService ? (
                          <div>
                            <strong>Great!</strong> {reportData.summary.totalWorking} out of {reportData.summary.totalConfigured} email service(s) are working. 
                            Your users will be able to receive verification emails.
                          </div>
                        ) : (
                          <div>
                            <strong>Issue:</strong> No email services are working. Users won't be able to receive verification emails. 
                            Please check the configuration and error messages above.
                          </div>
                        )}
                      </div>
                    </div>

                    {reportData.recommendations.length > 0 && (
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <h4 className="font-medium mb-2">💡 Recommendations</h4>
                        <ul className="text-sm text-blue-700 space-y-1">
                          {reportData.recommendations.map((rec, index) => (
                            <li key={index}>• {rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Help Section */}
          <Card>
            <CardHeader>
              <CardTitle>🆘 Troubleshooting Guide</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-sm">
                <div>
                  <strong className="text-red-600">Gmail SMTP Issues:</strong>
                  <ul className="list-disc pl-5 mt-2 space-y-1">
                    <li>Make sure <strong>2-Step Verification</strong> is enabled on your Google account</li>
                    <li>Use an <strong>App Password</strong> (16 characters) instead of your regular password</li>
                    <li>App Password should have <strong>no spaces</strong> in your .env.local file</li>
                    <li>Check that <code>GMAIL_USER</code> and <code>GMAIL_APP_PASSWORD</code> are correct</li>
                  </ul>
                </div>
                
                <div>
                  <strong className="text-blue-600">Environment Variables:</strong>
                  <div className="mt-2 p-3 bg-gray-50 rounded font-mono text-xs">
                    <div>GMAIL_USER=your-email@gmail.com</div>
                    <div>GMAIL_APP_PASSWORD=abcdefghijklmnop</div>
                    <div className="text-gray-500"># Optional services:</div>
                    <div>RESEND_API_KEY=re_your_key</div>
                    <div>SENDGRID_API_KEY=SG.your_key</div>
                  </div>
                </div>

                <div>
                  <strong className="text-green-600">Quick Fix Steps:</strong>
                  <ol className="list-decimal pl-5 mt-2 space-y-1">
                    <li>Go to <a href="https://myaccount.google.com/apppasswords" target="_blank" className="text-blue-600 underline">Google App Passwords</a></li>
                    <li>Create new App Password for "Mail" → "Other"</li>
                    <li>Copy the 16-character password (remove spaces)</li>
                    <li>Update your .env.local file</li>
                    <li>Restart your development server</li>
                    <li>Test again using this page</li>
                  </ol>
                </div>

                <div className="pt-2 border-t">
                  <strong>Still having issues?</strong>
                  <div className="mt-1">
                    Check your server console logs for detailed error messages, or try using the development fallback mode (no email config) to test the registration flow.
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}