"use server"

import { serverValidateEmail, suggestEmailCorrection, type EmailValidationResult } from "@/lib/email-validation"
import { createSupabaseAdminClient } from "@/lib/supabase"

export async function validateEmailAction(email: string): Promise<EmailValidationResult> {
  return await serverValidateEmail(email)
}

export async function checkEmailExistsInDatabase(email: string): Promise<{ exists: boolean, error?: string }> {
  try {
    const supabaseAdmin = createSupabaseAdminClient()
    
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000 
    })

    if (authError) {
      console.error("Error checking auth users:", authError)
      return { exists: false, error: "Unable to verify email availability" }
    }

    const emailExists = authUsers.users.some(user => 
      user.email?.toLowerCase() === email.toLowerCase()
    )

    if (emailExists) {
      return { exists: true }
    }

    const { data: profiles, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("email")
      .eq("email", email.toLowerCase())
      .limit(1)

    if (profileError) {
      console.error("Error checking profiles:", profileError)
    }

    const profileExists = profiles && profiles.length > 0

    return { exists: emailExists || profileExists }
  } catch (error) {
    console.error("Error in checkEmailExistsInDatabase:", error)
    return { exists: false, error: "Unable to verify email availability" }
  }
}

export async function comprehensiveEmailValidation(email: string): Promise<{
  isValid: boolean
  isGmail: boolean
  existsInDatabase: boolean
  suggestion?: string
  error?: string
}> {
  try {
    const formatValidation = await validateEmailAction(email)
    
    if (!formatValidation.isValid) {
      return {
        isValid: false,
        isGmail: formatValidation.isGmail,
        existsInDatabase: false,
        error: formatValidation.error
      }
    }

    const databaseCheck = await checkEmailExistsInDatabase(email)
    
    if (databaseCheck.error) {
      return {
        isValid: true,
        isGmail: formatValidation.isGmail,
        existsInDatabase: false,
        error: databaseCheck.error
      }
    }

    const suggestion = suggestEmailCorrection(email)

    return {
      isValid: true,
      isGmail: formatValidation.isGmail,
      existsInDatabase: databaseCheck.exists,
      suggestion: suggestion || undefined
    }
  } catch (error) {
    console.error("Error in comprehensiveEmailValidation:", error)
    return {
      isValid: false,
      isGmail: false,
      existsInDatabase: false,
      error: "Unable to validate email"
    }
  }
}