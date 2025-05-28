
import { supabase, isSupabaseConfigured } from "./supabase"

export interface ActivityDetails {
  [key: string]: any
}

export interface LogActivityParams {
  userId: string
  action: string
  resourceType: string
  resourceId?: string
  details?: ActivityDetails
  ipAddress?: string
  userAgent?: string
}

export const ACTIVITY_ACTIONS = {
  LOGIN: 'login',
  LOGOUT: 'logout',
  REGISTER: 'register',
  PASSWORD_RESET: 'password_reset',
  PASSWORD_UPDATE: 'password_update',
  
  PROFILE_UPDATE: 'profile_update',
  PROFILE_VIEW: 'profile_view',
  
  MATERIAL_VIEW: 'material_view',
  MATERIAL_START: 'material_start',
  MATERIAL_COMPLETE: 'material_complete',
  
  PROGRESS_UPDATE: 'progress_update',
  PROGRESS_START: 'progress_start',
  PROGRESS_COMPLETE: 'progress_complete',
  
  GOAL_CREATE: 'goal_create',
  GOAL_UPDATE: 'goal_update',
  GOAL_DELETE: 'goal_delete',
  GOAL_COMPLETE: 'goal_complete',
  
  SETTINGS_UPDATE: 'settings_update',
  THEME_CHANGE: 'theme_change',
  LANGUAGE_CHANGE: 'language_change',
} as const

export const RESOURCE_TYPES = {
  USER: 'user',
  PROFILE: 'profile',
  LEARNING_MATERIAL: 'learning_material',
  PROGRESS: 'progress',
  GOAL: 'goal',
  SETTINGS: 'settings',
  SESSION: 'session',
} as const

function getClientIP(): string | undefined {
  try {
    return undefined 
  } catch (error) {
    return undefined
  }
}

function getUserAgent(): string {
  try {
    return navigator.userAgent
  } catch (error) {
    return 'Unknown'
  }
}

export async function logUserActivity({
  userId,
  action,
  resourceType,
  resourceId,
  details,
  ipAddress,
  userAgent,
}: LogActivityParams): Promise<{ success: boolean; error?: any }> {
  try {
    if (!isSupabaseConfigured()) {
      console.log('Demo mode: Activity logged locally', {
        userId,
        action,
        resourceType,
        resourceId,
        details,
        timestamp: new Date().toISOString(),
      })
      return { success: true }
    }

    const activityData = {
      user_id: userId,
      action,
      resource_type: resourceType,
      resource_id: resourceId || null,
      details: details ? JSON.parse(JSON.stringify(details)) : null,
      ip_address: ipAddress || getClientIP(),
      user_agent: userAgent || getUserAgent(),
    }

    const { data, error } = await supabase
      .from('user_history')
      .insert([activityData])
      .select()
      .single()

    if (error) {
      console.error('Error logging user activity:', error)
      return { success: false, error }
    }

    console.log('User activity logged successfully:', data)
    return { success: true }
  } catch (error) {
    console.error('Error in logUserActivity:', error)
    return { success: false, error }
  }
}

export async function logLogin(userId: string, method: string = 'email_password') {
  return await logUserActivity({
    userId,
    action: ACTIVITY_ACTIONS.LOGIN,
    resourceType: RESOURCE_TYPES.SESSION,
    details: { login_method: method },
  })
}

export async function logLogout(userId: string) {
  return await logUserActivity({
    userId,
    action: ACTIVITY_ACTIONS.LOGOUT,
    resourceType: RESOURCE_TYPES.SESSION,
  })
}

export async function logRegistration(userId: string, method: string = 'email') {
  return await logUserActivity({
    userId,
    action: ACTIVITY_ACTIONS.REGISTER,
    resourceType: RESOURCE_TYPES.USER,
    resourceId: userId,
    details: { registration_method: method },
  })
}

export async function logProfileUpdate(userId: string, updatedFields: string[]) {
  return await logUserActivity({
    userId,
    action: ACTIVITY_ACTIONS.PROFILE_UPDATE,
    resourceType: RESOURCE_TYPES.PROFILE,
    resourceId: userId,
    details: { updated_fields: updatedFields },
  })
}

export async function logMaterialView(userId: string, materialId: string, durationSeconds?: number) {
  return await logUserActivity({
    userId,
    action: ACTIVITY_ACTIONS.MATERIAL_VIEW,
    resourceType: RESOURCE_TYPES.LEARNING_MATERIAL,
    resourceId: materialId,
    details: durationSeconds ? { duration_seconds: durationSeconds } : undefined,
  })
}

export async function logProgressUpdate(
  userId: string, 
  progressId: string, 
  oldProgress: number, 
  newProgress: number,
  completed: boolean = false
) {
  return await logUserActivity({
    userId,
    action: completed ? ACTIVITY_ACTIONS.PROGRESS_COMPLETE : ACTIVITY_ACTIONS.PROGRESS_UPDATE,
    resourceType: RESOURCE_TYPES.PROGRESS,
    resourceId: progressId,
    details: { 
      old_progress: oldProgress, 
      new_progress: newProgress,
      completed 
    },
  })
}

export async function logGoalCreate(userId: string, goalId: string, goalType: string, target?: any) {
  return await logUserActivity({
    userId,
    action: ACTIVITY_ACTIONS.GOAL_CREATE,
    resourceType: RESOURCE_TYPES.GOAL,
    resourceId: goalId,
    details: { goal_type: goalType, target },
  })
}

export async function logGoalComplete(userId: string, goalId: string, goalType: string) {
  return await logUserActivity({
    userId,
    action: ACTIVITY_ACTIONS.GOAL_COMPLETE,
    resourceType: RESOURCE_TYPES.GOAL,
    resourceId: goalId,
    details: { goal_type: goalType },
  })
}

export async function logSettingsUpdate(userId: string, updatedSettings: string[]) {
  return await logUserActivity({
    userId,
    action: ACTIVITY_ACTIONS.SETTINGS_UPDATE,
    resourceType: RESOURCE_TYPES.SETTINGS,
    details: { updated_settings: updatedSettings },
  })
}

export async function logThemeChange(userId: string, oldTheme: string, newTheme: string) {
  return await logUserActivity({
    userId,
    action: ACTIVITY_ACTIONS.THEME_CHANGE,
    resourceType: RESOURCE_TYPES.SETTINGS,
    details: { old_theme: oldTheme, new_theme: newTheme },
  })
}

export function useActivityLogger() {
  const getCurrentUserId = (): string | null => {
    try {
      return localStorage.getItem('userId') || null
    } catch {
      return null
    }
  }

  return {
    logActivity: (params: Omit<LogActivityParams, 'userId'>) => {
      const userId = getCurrentUserId()
      if (!userId) {
        console.warn('Cannot log activity: No user ID available')
        return Promise.resolve({ success: false, error: 'No user ID' })
      }
      return logUserActivity({ ...params, userId })
    },
    logLogin: (method?: string) => {
      const userId = getCurrentUserId()
      if (!userId) return Promise.resolve({ success: false })
      return logLogin(userId, method)
    },
    logLogout: () => {
      const userId = getCurrentUserId()
      if (!userId) return Promise.resolve({ success: false })
      return logLogout(userId)
    },
    logProfileUpdate: (updatedFields: string[]) => {
      const userId = getCurrentUserId()
      if (!userId) return Promise.resolve({ success: false })
      return logProfileUpdate(userId, updatedFields)
    },
    logMaterialView: (materialId: string, durationSeconds?: number) => {
      const userId = getCurrentUserId()
      if (!userId) return Promise.resolve({ success: false })
      return logMaterialView(userId, materialId, durationSeconds)
    },
    logProgressUpdate: (progressId: string, oldProgress: number, newProgress: number, completed?: boolean) => {
      const userId = getCurrentUserId()
      if (!userId) return Promise.resolve({ success: false })
      return logProgressUpdate(userId, progressId, oldProgress, newProgress, completed)
    },
    logGoalCreate: (goalId: string, goalType: string, target?: any) => {
      const userId = getCurrentUserId()
      if (!userId) return Promise.resolve({ success: false })
      return logGoalCreate(userId, goalId, goalType, target)
    },
    logGoalComplete: (goalId: string, goalType: string) => {
      const userId = getCurrentUserId()
      if (!userId) return Promise.resolve({ success: false })
      return logGoalComplete(userId, goalId, goalType)
    },
    logSettingsUpdate: (updatedSettings: string[]) => {
      const userId = getCurrentUserId()
      if (!userId) return Promise.resolve({ success: false })
      return logSettingsUpdate(userId, updatedSettings)
    },
    logThemeChange: (oldTheme: string, newTheme: string) => {
      const userId = getCurrentUserId()
      if (!userId) return Promise.resolve({ success: false })
      return logThemeChange(userId, oldTheme, newTheme)
    },
  }
}