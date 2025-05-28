"use client"

import type React from "react"
import { useState, useCallback, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { serverSignUp } from "@/app/actions/auth-actions"
import { comprehensiveEmailValidation } from "@/app/actions/email-validation-actions"
import { sendEmailVerificationPin } from "@/app/actions/email-verification-actions"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle, Mail } from "lucide-react"
import { supabase } from "@/lib/supabase"
import PinVerification from "@/components/PinVerification"

export default function RegisterPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<'registration' | 'email-verification' | 'completing'>('registration')
  const [emailValidation, setEmailValidation] = useState<{
    isValidating: boolean
    isValid: boolean
    isGmail: boolean
    existsInDatabase: boolean
    suggestion?: string
    error?: string
  } | null>(null)

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setFormData((prev) => ({ ...prev, [id]: value }))
  }

  const validateEmail = useCallback(async (email: string) => {
    if (!email || email.length < 3) {
      setEmailValidation(null)
      return
    }

    setEmailValidation(prev => ({ ...prev, isValidating: true } as any))

    try {
      const result = await comprehensiveEmailValidation(email)
      setEmailValidation({
        isValidating: false,
        ...result
      })
    } catch (error) {
      setEmailValidation({
        isValidating: false,
        isValid: false,
        isGmail: false,
        existsInDatabase: false,
        error: "Failed to validate email"
      })
    }
  }, [])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (formData.email) {
        validateEmail(formData.email)
      }
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [formData.email, validateEmail])

  const handleGoogleSignUp = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) throw error
    } catch (error: any) {
      console.error("Google sign-up failed:", error)
      setError(error.message || "Failed to sign up with Google")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }

    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setError("First name and last name are required")
      return
    }

    if (!formData.email.trim()) {
      setError("Email is required")
      return
    }

    if (emailValidation && !emailValidation.isValid) {
      setError(emailValidation.error || "Please enter a valid email address")
      return
    }

    if (emailValidation && emailValidation.existsInDatabase) {
      setError("An account with this email already exists. Please sign in instead.")
      return
    }

    setIsLoading(true)

    try {
      const pinResult = await sendEmailVerificationPin(formData.email, formData.firstName)
      
      if (!pinResult.success) {
        throw new Error(pinResult.error || "Failed to send verification code")
      }

      setStep('email-verification')
    } catch (error: any) {
      console.error("Registration failed:", error)
      setError(error.message || "Failed to send verification code. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleEmailVerified = async () => {
    setStep('completing')
    setError(null)

    try {
      const { user, error } = await serverSignUp(
        formData.email,
        formData.password,
        formData.firstName,
        formData.lastName,
      )

      if (error) throw error

      if (user) {
        router.push("/login?registered=true&verified=true")
      }
    } catch (error: any) {
      console.error("Account creation failed:", error)
      setError(error.message || "Failed to create account. Please try again.")
      setStep('registration') 
    }
  }

  const handleCancelVerification = () => {
    setStep('registration')
    setError(null)
  }

  if (step === 'email-verification') {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800">
        <div className="m-auto">
          <PinVerification
            email={formData.email}
            firstName={formData.firstName}
            onVerificationSuccess={handleEmailVerified}
            onCancel={handleCancelVerification}
          />
        </div>
      </div>
    )
  }

  if (step === 'completing') {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800">
        <div className="m-auto w-full max-w-md p-8 bg-white rounded-lg shadow-xl text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold mb-2">Creating Your Account</h2>
          <p className="text-gray-600">Please wait while we set up your account...</p>
          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800">
      <div className="m-auto w-full max-w-md p-8 bg-white rounded-lg shadow-xl">
        <div className="flex justify-center mb-6">
          <div className="flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-black"
            >
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
            </svg>
            <h1 className="text-xl font-bold">Learning Habit Tracker</h1>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-center mb-2">Create an account</h2>
        <p className="text-center text-sm text-gray-600 mb-6">
          We'll send a verification code to your email
        </p>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                type="text"
                placeholder="John"
                value={formData.firstName}
                onChange={handleInputChange}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                type="text"
                placeholder="Doe"
                value={formData.lastName}
                onChange={handleInputChange}
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={formData.email}
                onChange={handleInputChange}
                required
                disabled={isLoading}
                className={
                  emailValidation?.isValid === false 
                    ? "border-red-500 focus:border-red-500" 
                    : emailValidation?.isValid === true 
                    ? "border-green-500 focus:border-green-500" 
                    : ""
                }
              />
              
              {/* Email validation indicator */}
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                {emailValidation?.isValidating && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500"></div>
                )}
                {emailValidation?.isValid === true && !emailValidation.existsInDatabase && (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                )}
                {emailValidation?.isValid === false && (
                  <AlertCircle className="h-4 w-4 text-red-500" />
                )}
                {emailValidation?.existsInDatabase && (
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                )}
              </div>
            </div>
            
            {/* Email validation messages */}
            {emailValidation && (
              <div className="space-y-1">
                {emailValidation.isGmail && (
                  <div className="flex items-center gap-1 text-sm text-blue-600">
                    <Mail className="h-3 w-3" />
                    <span>Gmail address detected - verification required</span>
                  </div>
                )}
                
                {emailValidation.error && (
                  <p className="text-sm text-red-600">{emailValidation.error}</p>
                )}
                
                {emailValidation.existsInDatabase && (
                  <p className="text-sm text-yellow-600">
                    This email is already registered. 
                    <Link href="/login" className="text-blue-600 hover:underline ml-1">
                      Sign in instead?
                    </Link>
                  </p>
                )}
                
                {emailValidation.suggestion && (
                  <p className="text-sm text-gray-600">
                    Did you mean: 
                    <button
                      type="button"
                      className="text-blue-600 hover:underline ml-1"
                      onClick={() => setFormData(prev => ({ ...prev, email: emailValidation.suggestion! }))}
                    >
                      {emailValidation.suggestion}
                    </button>?
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input 
              id="password" 
              type="password" 
              value={formData.password} 
              onChange={handleInputChange} 
              required 
              disabled={isLoading}
              minLength={6}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              required
              disabled={isLoading}
              minLength={6}
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
            disabled={isLoading || (emailValidation && (!emailValidation.isValid || emailValidation.existsInDatabase))}
          >
            {isLoading ? "Sending verification..." : "Send Verification Code"}
          </Button>
        </form>

        <div className="text-center mt-4 text-sm">
          <span className="text-gray-600">Already have an account? </span>
          <Link href="/login" className="text-indigo-600 hover:underline">
            Sign in
          </Link>
        </div>

        <div className="mt-4">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>

          <div className="mt-4">
            <Button
              type="button"
              variant="outline"
              className="w-full flex items-center justify-center gap-2 border-gray-300 hover:bg-gray-50"
              onClick={handleGoogleSignUp}
              disabled={isLoading}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px">
                <path
                  fill="#FFC107"
                  d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
                />
                <path
                  fill="#FF3D00"
                  d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
                />
                <path
                  fill="#4CAF50"
                  d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
                />
                <path
                  fill="#1976D2"
                  d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"
                />
              </svg>
              Sign up with Google
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}