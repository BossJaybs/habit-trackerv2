import { logLoginActivity, logLogoutActivity, logUserActivity } from "@/app/actions/auth-actions"

export function useServerActivityLogging() {
  const logLogin = async (userId: string, method: string = "email_password") => {
    try {
      await logLoginActivity(userId, method)
    } catch (error) {
      console.error("Failed to log login:", error)
    }
  }

  const logLogout = async (userId: string) => {
    try {
      await logLogoutActivity(userId)
    } catch (error) {
      console.error("Failed to log logout:", error)
    }
  }

  const logActivity = async (
    userId: string, 
    action: string, 
    resourceType: string, 
    resourceId?: string, 
    details?: any
  ) => {
    try {
      await logUserActivity(userId, action, resourceType, resourceId, details)
    } catch (error) {
      console.error(`Failed to log ${action}:`, error)
    }
  }

  return {
    logLogin,
    logLogout,
    logActivity,
    logProfileUpdate: (userId: string, fields: string[]) => 
      logActivity(userId, "profile_update", "profile", userId, { updated_fields: fields }),
    
    logMaterialView: (userId: string, materialId: string, duration?: number) => 
      logActivity(userId, "material_view", "learning_material", materialId, 
        duration ? { duration_seconds: duration } : undefined),
    
    logProgressUpdate: (userId: string, progressId: string, oldProgress: number, newProgress: number) => 
      logActivity(userId, "progress_update", "progress", progressId, 
        { old_progress: oldProgress, new_progress: newProgress }),
    
    logGoalCreate: (userId: string, goalId: string, goalType: string, target?: any) => 
      logActivity(userId, "goal_create", "goal", goalId, { goal_type: goalType, target }),
  }
}

