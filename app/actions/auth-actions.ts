"use server"

import { createSupabaseAdminClient } from "@/lib/supabase"

export async function serverSignUp(email: string, password: string, firstName: string, lastName: string) {
  try {
    const supabaseAdmin = createSupabaseAdminClient()
    
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, 
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
      },
    })

    if (error) {
      console.error("Error creating user:", error)
      return { user: null, error }
    }

    if (!data.user) {
      return { user: null, error: { message: "Failed to create user" } }
    }

    const { error: profileError } = await supabaseAdmin.from("profiles").insert({
      user_id: data.user.id,
      first_name: firstName,
      last_name: lastName,
      email: email,
    })

    if (profileError) {
      console.error("Error creating profile:", profileError)
    }

    const { error: preferencesError } = await supabaseAdmin.from("preferences").insert({
      user_id: data.user.id,
      theme: "system",
      email_notifications: true,
      push_notifications: true,
      weekly_summary: true,
      goal_reminders: true,
      language: "en",
      date_format: "mdy",
    })

    if (preferencesError) {
      console.error("Error creating preferences:", preferencesError)
    }

    return { user: data.user, error: null }
  } catch (error) {
    console.error("Error in server signup:", error)
    return { 
      user: null, 
      error: error instanceof Error ? error : { message: "Unknown error occurred" } 
    }
  }
}