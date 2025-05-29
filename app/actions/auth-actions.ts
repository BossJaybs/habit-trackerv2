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

    try {
      const { error: historyError } = await supabaseAdmin.from("user_history").insert({
        user_id: data.user.id,
        action: "register",
        resource_type: "user",
        resource_id: data.user.id,
        details: { 
          registration_method: "email",
          first_name: firstName,
          last_name: lastName 
        },
        ip_address: null, 
        user_agent: "Server Registration",
        created_at: new Date().toISOString()
      })

      if (historyError) {
        console.error("Error logging registration activity:", historyError)
      } else {
        console.log("Registration activity logged for user:", data.user.id)
      }
    } catch (logError) {
      console.error("Failed to log registration activity:", logError)
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

export async function logLoginActivity(userId: string, loginMethod: string = "email_password") {
  try {
    const supabaseAdmin = createSupabaseAdminClient()
    
    const { error } = await supabaseAdmin.from("user_history").insert({
      user_id: userId,
      action: "login",
      resource_type: "session",
      resource_id: null,
      details: { 
        login_method: loginMethod,
        timestamp: new Date().toISOString()
      },
      ip_address: null, 
      user_agent: "Server Login",
      created_at: new Date().toISOString()
    })

    if (error) {
      console.error("Error logging login activity:", error)
      return { success: false, error }
    }

    console.log("Login activity logged for user:", userId)
    return { success: true, error: null }
  } catch (error) {
    console.error("Failed to log login activity:", error)
    return { success: false, error }
  }
}

export async function logLogoutActivity(userId: string) {
  try {
    const supabaseAdmin = createSupabaseAdminClient()
    
    const { error } = await supabaseAdmin.from("user_history").insert({
      user_id: userId,
      action: "logout",
      resource_type: "session",
      resource_id: null,
      details: { 
        timestamp: new Date().toISOString()
      },
      ip_address: null,
      user_agent: "Server Logout",
      created_at: new Date().toISOString()
    })

    if (error) {
      console.error("Error logging logout activity:", error)
      return { success: false, error }
    }

    console.log("Logout activity logged for user:", userId)
    return { success: true, error: null }
  } catch (error) {
    console.error("Failed to log logout activity:", error)
    return { success: false, error }
  }
}

export async function logProfileUpdateActivity(userId: string, updatedFields: string[]) {
  try {
    const supabaseAdmin = createSupabaseAdminClient()
    
    const { error } = await supabaseAdmin.from("user_history").insert({
      user_id: userId,
      action: "profile_update",
      resource_type: "profile",
      resource_id: userId,
      details: { 
        updated_fields: updatedFields,
        timestamp: new Date().toISOString()
      },
      ip_address: null,
      user_agent: "Server Profile Update",
      created_at: new Date().toISOString()
    })

    if (error) {
      console.error("Error logging profile update activity:", error)
      return { success: false, error }
    }

    console.log("Profile update activity logged for user:", userId)
    return { success: true, error: null }
  } catch (error) {
    console.error("Failed to log profile update activity:", error)
    return { success: false, error }
  }
}

export async function logMaterialViewActivity(userId: string, materialId: string, durationSeconds?: number) {
  try {
    const supabaseAdmin = createSupabaseAdminClient()
    
    const { error } = await supabaseAdmin.from("user_history").insert({
      user_id: userId,
      action: "material_view",
      resource_type: "learning_material",
      resource_id: materialId,
      details: { 
        duration_seconds: durationSeconds,
        timestamp: new Date().toISOString()
      },
      ip_address: null,
      user_agent: "Server Material View",
      created_at: new Date().toISOString()
    })

    if (error) {
      console.error("Error logging material view activity:", error)
      return { success: false, error }
    }

    console.log("Material view activity logged for user:", userId)
    return { success: true, error: null }
  } catch (error) {
    console.error("Failed to log material view activity:", error)
    return { success: false, error }
  }
}

export async function logProgressUpdateActivity(
  userId: string, 
  progressId: string, 
  oldProgress: number, 
  newProgress: number,
  completed: boolean = false
) {
  try {
    const supabaseAdmin = createSupabaseAdminClient()
    
    const action = completed ? "progress_complete" : "progress_update"
    
    const { error } = await supabaseAdmin.from("user_history").insert({
      user_id: userId,
      action: action,
      resource_type: "progress",
      resource_id: progressId,
      details: { 
        old_progress: oldProgress,
        new_progress: newProgress,
        completed: completed,
        timestamp: new Date().toISOString()
      },
      ip_address: null,
      user_agent: "Server Progress Update",
      created_at: new Date().toISOString()
    })

    if (error) {
      console.error("Error logging progress update activity:", error)
      return { success: false, error }
    }

    console.log(`Progress ${completed ? 'completion' : 'update'} activity logged for user:`, userId)
    return { success: true, error: null }
  } catch (error) {
    console.error("Failed to log progress update activity:", error)
    return { success: false, error }
  }
}

export async function logGoalCreateActivity(userId: string, goalId: string, goalType: string, target?: any) {
  try {
    const supabaseAdmin = createSupabaseAdminClient()
    
    const { error } = await supabaseAdmin.from("user_history").insert({
      user_id: userId,
      action: "goal_create",
      resource_type: "goal",
      resource_id: goalId,
      details: { 
        goal_type: goalType,
        target: target,
        timestamp: new Date().toISOString()
      },
      ip_address: null,
      user_agent: "Server Goal Create",
      created_at: new Date().toISOString()
    })

    if (error) {
      console.error("Error logging goal create activity:", error)
      return { success: false, error }
    }

    console.log("Goal create activity logged for user:", userId)
    return { success: true, error: null }
  } catch (error) {
    console.error("Failed to log goal create activity:", error)
    return { success: false, error }
  }
}

export async function logGoalCompleteActivity(userId: string, goalId: string, goalType: string) {
  try {
    const supabaseAdmin = createSupabaseAdminClient()
    
    const { error } = await supabaseAdmin.from("user_history").insert({
      user_id: userId,
      action: "goal_complete",
      resource_type: "goal",
      resource_id: goalId,
      details: { 
        goal_type: goalType,
        timestamp: new Date().toISOString()
      },
      ip_address: null,
      user_agent: "Server Goal Complete",
      created_at: new Date().toISOString()
    })

    if (error) {
      console.error("Error logging goal complete activity:", error)
      return { success: false, error }
    }

    console.log("Goal complete activity logged for user:", userId)
    return { success: true, error: null }
  } catch (error) {
    console.error("Failed to log goal complete activity:", error)
    return { success: false, error }
  }
}

export async function logSettingsUpdateActivity(userId: string, updatedSettings: string[]) {
  try {
    const supabaseAdmin = createSupabaseAdminClient()
    
    const { error } = await supabaseAdmin.from("user_history").insert({
      user_id: userId,
      action: "settings_update",
      resource_type: "settings",
      resource_id: null,
      details: { 
        updated_settings: updatedSettings,
        timestamp: new Date().toISOString()
      },
      ip_address: null,
      user_agent: "Server Settings Update",
      created_at: new Date().toISOString()
    })

    if (error) {
      console.error("Error logging settings update activity:", error)
      return { success: false, error }
    }

    console.log("Settings update activity logged for user:", userId)
    return { success: true, error: null }
  } catch (error) {
    console.error("Failed to log settings update activity:", error)
    return { success: false, error }
  }
}

export async function logUserActivity(
  userId: string, 
  action: string, 
  resourceType: string, 
  resourceId?: string, 
  details?: any
) {
  try {
    const supabaseAdmin = createSupabaseAdminClient()
    
    const { error } = await supabaseAdmin.from("user_history").insert({
      user_id: userId,
      action: action,
      resource_type: resourceType,
      resource_id: resourceId || null,
      details: details ? { ...details, timestamp: new Date().toISOString() } : { timestamp: new Date().toISOString() },
      ip_address: null,
      user_agent: "Server Action",
      created_at: new Date().toISOString()
    })

    if (error) {
      console.error("Error logging user activity:", error)
      return { success: false, error }
    }

    console.log(`${action} activity logged for user:`, userId)
    return { success: true, error: null }
  } catch (error) {
    console.error("Failed to log user activity:", error)
    return { success: false, error }
  }
}