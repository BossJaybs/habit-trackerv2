"use client"

import React, { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle, Mail, Clock } from "lucide-react"
import { verifyEmailPin, resendEmailVerificationPin } from "@/app/actions/email-verification-actions"

interface PinVerificationProps {
  email: string
  firstName?: string
  onVerificationSuccess: () => void
  onCancel: () => void
}

export default function PinVerification({ 
  email, 
  firstName, 
  onVerificationSuccess, 
  onCancel 
}: PinVerificationProps) {
  const [pin, setPin] = useState(['', '', '', '', '', ''])
  const [isVerifying, setIsVerifying] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null)
  const [countdown, setCountdown] = useState(0)
  const [canResend, setCanResend] = useState(false)
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    setCountdown(60)
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setCanResend(true)
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const handlePinChange = (index: number, value: string) => {
    if (value.length > 1) return
    
    const newPin = [...pin]
    newPin[index] = value
    setPin(newPin)
    setError(null)

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }

    if (newPin.every(digit => digit !== '') && newPin.join('').length === 6) {
      verifyPin(newPin.join(''))
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    
    if (pastedData.length === 6) {
      const newPin = pastedData.split('')
      setPin(newPin)
      verifyPin(pastedData)
    }
  }

  const verifyPin = async (pinCode: string) => {
    if (pinCode.length !== 6) return

    setIsVerifying(true)
    setError(null)

    try {
      const result = await verifyEmailPin(email, pinCode)
      
      if (result.success) {
        onVerificationSuccess()
      } else {
        setError(result.error || 'Invalid verification code')
        setAttemptsRemaining(result.attemptsRemaining || null)
        
        setPin(['', '', '', '', '', ''])
        inputRefs.current[0]?.focus()
      }
    } catch (error) {
      setError('Failed to verify PIN. Please try again.')
    } finally {
      setIsVerifying(false)
    }
  }

  const handleResend = async () => {
    setIsResending(true)
    setError(null)

    try {
      const result = await resendEmailVerificationPin(email, firstName)
      
      if (result.success) {
        setCountdown(60)
        setCanResend(false)
        setPin(['', '', '', '', '', ''])
        inputRefs.current[0]?.focus()
        
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              setCanResend(true)
              clearInterval(timer)
              return 0
            }
            return prev - 1
          })
        }, 1000)
      } else {
        setError(result.error || 'Failed to resend verification code')
      }
    } catch (error) {
      setError('Failed to resend verification code')
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto p-8 bg-white rounded-lg shadow-xl">
      <div className="text-center mb-6">
        <div className="flex justify-center items-center gap-2 mb-4">
          <Mail className="h-6 w-6 text-blue-500" />
          <h2 className="text-xl font-bold">Verify Your Email</h2>
        </div>
        
        <p className="text-gray-600 text-sm">
          We've sent a 6-digit verification code to:
        </p>
        <p className="text-gray-900 font-medium mt-1">{email}</p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {attemptsRemaining !== null && attemptsRemaining > 0 && (
        <Alert className="mb-4 border-yellow-200 bg-yellow-50">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            {attemptsRemaining} attempt{attemptsRemaining !== 1 ? 's' : ''} remaining
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-6">
        <div className="flex justify-center gap-2" onPaste={handlePaste}>
          {pin.map((digit, index) => (
            <Input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handlePinChange(index, e.target.value.replace(/\D/g, ''))}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className="w-12 h-12 text-center text-lg font-bold border-2 focus:border-blue-500"
              disabled={isVerifying}
            />
          ))}
        </div>

        {isVerifying && (
          <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            <span>Verifying...</span>
          </div>
        )}

        <div className="text-center space-y-3">
          <p className="text-sm text-gray-600">Didn't receive the code?</p>
          
          {canResend ? (
            <Button
              variant="outline"
              onClick={handleResend}
              disabled={isResending}
              className="w-full"
            >
              {isResending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500 mr-2"></div>
                  Sending...
                </>
              ) : (
                'Resend Code'
              )}
            </Button>
          ) : (
            <div className="flex items-center justify-center gap-1 text-sm text-gray-500">
              <Clock className="h-4 w-4" />
              <span>Resend in {countdown}s</span>
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex-1"
            disabled={isVerifying || isResending}
          >
            Cancel
          </Button>
          
          <Button
            onClick={() => verifyPin(pin.join(''))}
            disabled={pin.some(digit => !digit) || isVerifying || isResending}
            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            {isVerifying ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Verifying...
              </>
            ) : (
              'Verify'
            )}
          </Button>
        </div>
      </div>

      <div className="mt-6 text-center">
        <p className="text-xs text-gray-500">
          The verification code will expire in 10 minutes
        </p>
      </div>
    </div>
  )
}