"use server"

import { supabase } from "@/lib/supabase"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { isSupabaseConfigured } from "@/lib/supabase"

export async function getUsers() {
  try {
    if (!isSupabaseConfigured()) {
      return {
        users: [
          {
            id: "1",
            user_id: "1",
            first_name: "John",
            last_name: "Doe",
            email: "john@example.com",
            created_at: new Date().toISOString(),
          },
          {
            id: "2",
            user_id: "2",
            first_name: "Jane",
            last_name: "Smith",
            email: "jane@example.com",
            created_at: new Date().toISOString(),
          },
        ],
        error: null,
      }
    }

    const { data, error } = await supabase.from("profiles").select("*")

    if (error) {
      console.error("Error getting users:", error)
      return { users: [], error }
    }

    return { users: data || [], error: null }
  } catch (error) {
    console.error("Error in getUsers:", error)
    return { users: [], error }
  }
}

export async function getUserHistory() {
  try {
    if (!isSupabaseConfigured()) {
      return {
        history: [
          {
            id: "1",
            user_id: "1",
            action: "login",
            resource_type: "session",
            resource_id: "1",
            details: { login_method: "email_password" },
            ip_address: "192.168.1.1",
            user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            profiles: {
              first_name: "John",
              last_name: "Doe",
              email: "john@example.com",
            },
          },
          {
            id: "2",
            user_id: "1",
            action: "material_view",
            resource_type: "learning_material",
            resource_id: "1",
            details: { duration_seconds: 180 },
            ip_address: "192.168.1.1",
            user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
            profiles: {
              first_name: "John",
              last_name: "Doe",
              email: "john@example.com",
            },
            learning_materials: {
              title: "Introduction to JavaScript",
            },
          },
          {
            id: "3",
            user_id: "2",
            action: "register",
            resource_type: "user",
            resource_id: "2",
            details: { registration_method: "email" },
            ip_address: "192.168.1.2",
            user_agent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
            created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            profiles: {
              first_name: "Jane",
              last_name: "Smith",
              email: "jane@example.com",
            },
          },
          {
            id: "4",
            user_id: "1",
            action: "progress_update",
            resource_type: "progress",
            resource_id: "1",
            details: { old_progress: 50, new_progress: 75 },
            ip_address: "192.168.1.1",
            user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
            profiles: {
              first_name: "John",
              last_name: "Doe",
              email: "john@example.com",
            },
          },
          {
            id: "5",
            user_id: "2",
            action: "goal_create",
            resource_type: "goal",
            resource_id: "1",
            details: { goal_type: "daily_learning", target_minutes: 60 },
            ip_address: "192.168.1.2",
            user_agent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
            created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
            profiles: {
              first_name: "Jane",
              last_name: "Smith",
              email: "jane@example.com",
            },
          },
          {
            id: "6",
            user_id: "1",
            action: "profile_update",
            resource_type: "user",
            resource_id: "1",
            details: { updated_fields: ["bio", "avatar_url"] },
            ip_address: "192.168.1.1",
            user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            created_at: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
            profiles: {
              first_name: "John",
              last_name: "Doe",
              email: "john@example.com",
            },
          },
        ],
        error: null,
      }
    }

    const { error: tableCheckError } = await supabase.from("user_history").select("id").limit(1)

    if (tableCheckError) {
      console.error("Error checking user_history table:", tableCheckError)
      return { history: [], error: tableCheckError }
    }

    const { data: historyData, error: historyError } = await supabase
      .from("user_history")
      .select("*")
      .order('created_at', { ascending: false })

    if (historyError) {
      console.error("Error getting user history:", historyError)
      return { history: [], error: historyError }
    }

    if (!historyData || historyData.length === 0) {
      return { history: [], error: null }
    }

    const userIds = [...new Set(historyData.map((item) => item.user_id))]

    const materialIds = [...new Set(
      historyData
        .filter(item => item.resource_type === 'learning_material' && item.resource_id)
        .map(item => item.resource_id)
    )]

    let profilesData = []
    if (userIds.length > 0) {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, first_name, last_name, email")
        .in("user_id", userIds)

      if (profilesError) {
        console.error("Error getting user profiles:", profilesError)
      } else {
        profilesData = profiles || []
      }
    }

    let materialsData = []
    if (materialIds.length > 0) {
      const { data: materials, error: materialsError } = await supabase
        .from("learning_materials")
        .select("id, title")
        .in("id", materialIds)

      if (materialsError) {
        console.error("Error getting learning materials:", materialsError)
      } else {
        materialsData = materials || []
      }
    }

    const profilesMap = profilesData.reduce((map, profile) => {
      map[profile.user_id] = profile
      return map
    }, {} as Record<string, any>)

    const materialsMap = materialsData.reduce((map, material) => {
      map[material.id] = material
      return map
    }, {} as Record<string, any>)

    const combinedHistory = historyData.map((item) => ({
      ...item,
      profiles: profilesMap[item.user_id] || null,
      learning_materials: item.resource_type === 'learning_material' && item.resource_id 
        ? materialsMap[item.resource_id] || null 
        : null,
    }))

    return { history: combinedHistory, error: null }
  } catch (error) {
    console.error("Error in getUserHistory:", error)
    return { history: [], error }
  }
}

export async function getUserProgress() {
  try {
    if (!isSupabaseConfigured()) {
      return {
        progress: [
          {
            id: "1",
            user_id: "1",
            material_id: "1",
            progress: 75,
            completed: false,
            started_at: new Date().toISOString(),
            completed_at: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            profiles: {
              first_name: "John",
              last_name: "Doe",
              email: "john@example.com",
            },
            learning_materials: {
              title: "Introduction to JavaScript",
              description: "Learn the basics of JavaScript programming",
              category: "Programming",
              difficulty: "beginner",
            },
          },
          {
            id: "2",
            user_id: "2",
            material_id: "2",
            progress: 100,
            completed: true,
            started_at: new Date().toISOString(),
            completed_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            profiles: {
              first_name: "Jane",
              last_name: "Smith",
              email: "jane@example.com",
            },
            learning_materials: {
              title: "CSS Grid Layout",
              description: "Learn how to create responsive layouts with CSS Grid",
              category: "Web Design",
              difficulty: "intermediate",
            },
          },
        ],
        error: null,
      }
    }

    const { error: tableCheckError } = await supabase.from("user_progress").select("id").limit(1)

    if (tableCheckError) {
      console.error("Error checking user_progress table:", tableCheckError)
      return { progress: [], error: tableCheckError }
    }

    const { data: progressData, error: progressError } = await supabase.from("user_progress").select("*")

    if (progressError) {
      console.error("Error getting user progress:", progressError)
      return { progress: [], error: progressError }
    }

    if (!progressData || progressData.length === 0) {
      return { progress: [], error: null }
    }

    const userIds = [...new Set(progressData.map((item) => item.user_id))]

    const materialIds = [...new Set(progressData.map((item) => item.material_id))]

    const { data: profilesData, error: profilesError } = await supabase
      .from("profiles")
      .select("*")
      .in("user_id", userIds)

    if (profilesError) {
      console.error("Error getting user profiles:", profilesError)
    }

    const { data: materialsData, error: materialsError } = await supabase
      .from("learning_materials")
      .select("*")
      .in("id", materialIds)

    if (materialsError) {
      console.error("Error getting learning materials:", materialsError)
    }

    const profilesMap = (profilesData || []).reduce((map, profile) => {
      map[profile.user_id] = profile
      return map
    }, {})

    const materialsMap = (materialsData || []).reduce((map, material) => {
      map[material.id] = material
      return map
    }, {})

    const combinedProgress = progressData.map((progress) => ({
      ...progress,
      profiles: profilesMap[progress.user_id] || null,
      learning_materials: materialsMap[progress.material_id] || null,
    }))

    return { progress: combinedProgress, error: null }
  } catch (error) {
    console.error("Error in getUserProgress:", error)
    return { progress: [], error }
  }
}

export async function getLearningMaterials() {
  try {
    if (!isSupabaseConfigured()) {
      return {
        materials: [
          {
            id: "1",
            title: "Introduction to JavaScript",
            description: "Learn the basics of JavaScript programming",
            content: "JavaScript is a programming language that enables interactive web pages...",
            category: "Programming",
            difficulty: "beginner",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: "2",
            title: "CSS Grid Layout",
            description: "Learn how to create responsive layouts with CSS Grid",
            content: "CSS Grid Layout is a two-dimensional layout system for the web...",
            category: "Web Design",
            difficulty: "intermediate",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: "3",
            title: "Advanced React Patterns",
            description: "Master advanced React design patterns",
            content: "In this course, we will explore advanced React patterns like render props...",
            category: "Web Development",
            difficulty: "advanced",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ],
        error: null,
      }
    }

    const { data, error } = await supabase.from("learning_materials").select("*")

    if (error) {
      console.error("Error getting learning materials:", error)
      return { materials: [], error }
    }

    return { materials: data || [], error: null }
  } catch (error) {
    console.error("Error in getLearningMaterials:", error)
    return { materials: [], error }
  }
}

export async function createLearningMaterial(material: {
  title: string
  description: string
  content: string
  category: string
  difficulty: string
}) {
  try {
    const { data: authUser } = await supabase.auth.getUser()

    const { data, error } = await supabase
      .from("learning_materials")
      .insert([
        {
          ...material,
          created_by: authUser.user?.id,
        },
      ])
      .select()

    if (error) {
      console.error("Error creating learning material:", error)
      return { success: false, data: null, error }
    }

    return { success: true, data, error: null }
  } catch (error) {
    console.error("Error in createLearningMaterial:", error)
    return { success: false, data: null, error }
  }
}

export async function updateLearningMaterial(
  id: string,
  material: {
    title: string
    description?: string
    content?: string
    category: string
    difficulty: string
  },
) {
  try {
    const { data, error } = await supabase
      .from("learning_materials")
      .update({
        title: material.title,
        description: material.description,
        content: material.content,
        category: material.category,
        difficulty: material.difficulty,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()

    if (error) {
      console.error("Error updating learning material:", error)
      return { success: false, data: null, error }
    }

    return { success: true, data, error: null }
  } catch (error) {
    console.error("Error in updateLearningMaterial:", error)
    return { success: false, data: null, error }
  }
}

export async function updateUserProgress(
  id: string,
  progress: {
    progress: number
    completed: boolean
  },
) {
  try {
    const updateData: any = {
      progress: progress.progress,
      completed: progress.completed,
      updated_at: new Date().toISOString(),
    }

    if (progress.completed) {
      updateData.completed_at = new Date().toISOString()
    } else {
      updateData.completed_at = null
    }

    const { data, error } = await supabase.from("user_progress").update(updateData).eq("id", id).select()

    if (error) {
      console.error("Error updating user progress:", error)
      return { success: false, data: null, error }
    }

    return { success: true, data, error: null }
  } catch (error) {
    console.error("Error in updateUserProgress:", error)
    return { success: false, data: null, error }
  }
}

export async function deleteLearningMaterial(id: string) {
  try {
    const { error } = await supabase.from("learning_materials").delete().eq("id", id)

    if (error) {
      console.error("Error deleting learning material:", error)
      return { success: false, error }
    }

    return { success: true, error: null }
  } catch (error) {
    console.error("Error in deleteLearningMaterial:", error)
    return { success: false, error }
  }
}

export async function deleteUser(userId: string) {
  try {
    const { error: profileError } = await supabase.from("profiles").delete().eq("user_id", userId)

    if (profileError) {
      console.error("Error deleting user profile:", profileError)
      return { success: false, error: profileError }
    }

    return { success: true, error: null }
  } catch (error) {
    console.error("Error in deleteUser:", error)
    return { success: false, error }
  }
}

export async function isUserAdmin(): Promise<boolean> {
  try {
    const adminSession = cookies().get("admin_session")
    if (adminSession) {
      return true
    }

    const { data: authUser } = await supabase.auth.getUser()
    if (!authUser.user) {
      return false
    }

    const { data, error } = await supabase.from("admin_users").select("*").eq("user_id", authUser.user.id).single()

    if (error || !data) {
      return false
    }

    return true
  } catch (error) {
    console.error("Error in isUserAdmin:", error)
    return false
  }
}

export async function loginAsAdmin() {
  cookies().set("isAdmin", "true", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24,
    path: "/",
  })

  redirect("/admin")
}

export async function checkAdminStatus() {
  if (!isSupabaseConfigured()) {
    return { isAdmin: true }
  }

  const isAdmin = cookies().get("isAdmin")?.value === "true"
  return { isAdmin }
}

export async function logoutAdmin() {
  cookies().delete("isAdmin")
  redirect("/login")
}