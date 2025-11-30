// Local storage with Azure fallback for SolaFire
import { azureStorage, type GlobalData, type SystemUser } from "./azure"

// Local storage keys
const STORAGE_KEYS = {
  CURRENT_USER: 'solafire_current_user',
  USER_DATA_PREFIX: 'solafire_user_data_',
  SYSTEM_USERS: 'solafire_system_users'
}

// User management
export function getCurrentUser(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(STORAGE_KEYS.CURRENT_USER)
}

export function setCurrentUser(email: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEYS.CURRENT_USER, email)
}

export function clearCurrentUser(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEYS.CURRENT_USER)
}

// User-specific data
export async function getCurrentUserData(): Promise<GlobalData> {
  const currentUser = getCurrentUser()
  if (!currentUser) {
    return {
      projects: [],
      users: [],
      allocations: [],
      positions: [],
      entities: []
    }
  }

  // Try Azure first, fallback to localStorage
  try {
    const azureData = await azureStorage.getGlobalData(`user_${currentUser}`)
    if (azureData.projects.length > 0 || azureData.users.length > 0) {
      return azureData
    }
  } catch (error) {
    console.log("Azure not available, using localStorage")
  }

  // Fallback to localStorage
  const localData = localStorage.getItem(STORAGE_KEYS.USER_DATA_PREFIX + currentUser)
  return localData ? JSON.parse(localData) : {
    projects: [],
    users: [],
    allocations: [],
    positions: [],
    entities: []
  }
}

export async function setCurrentUserData(data: Partial<GlobalData>): Promise<void> {
  const currentUser = getCurrentUser()
  if (!currentUser) return

  // Save to Azure if available
  try {
    await azureStorage.setGlobalData(`user_${currentUser}`, data)
  } catch (error) {
    console.log("Azure not available, using localStorage")
  }

  // Always save to localStorage as backup
  const existingData = await getCurrentUserData()
  const updatedData = { ...existingData, ...data }
  localStorage.setItem(STORAGE_KEYS.USER_DATA_PREFIX + currentUser, JSON.stringify(updatedData))
}

// System user management
export async function getCurrentSystemUser(): Promise<SystemUser | null> {
  const currentUser = getCurrentUser()
  if (!currentUser) return null

  // Try Azure first, fallback to localStorage
  try {
    const systemUsers = await getSystemUsers()
    return systemUsers.find(u => u.email === currentUser && u.isActive) || null
  } catch (error) {
    console.log("Azure not available, using localStorage")
  }

  // Fallback to localStorage
  const localUsers = localStorage.getItem(STORAGE_KEYS.SYSTEM_USERS)
  const users: SystemUser[] = localUsers ? JSON.parse(localUsers) : []
  return users.find(u => u.email === currentUser && u.isActive) || null
}

export async function getSystemUsers(): Promise<SystemUser[]> {
  // Try Azure first, fallback to localStorage
  try {
    const azureData = await azureStorage.getGlobalData('system')
    if (azureData.users && azureData.users.length > 0) {
      return azureData.users
    }
  } catch (error) {
    console.log("Azure not available, using localStorage")
  }

  // Fallback to localStorage
  const localUsers = localStorage.getItem(STORAGE_KEYS.SYSTEM_USERS)
  return localUsers ? JSON.parse(localUsers) : []
}

// Initialize with demo data if needed
export async function initializeDemoData(): Promise<void> {
  const systemUsers = await getSystemUsers()
  
  if (systemUsers.length === 0) {
    // Create demo admin user
    const demoUsers: SystemUser[] = [
      {
        id: "1",
        email: "admin@sola.com",
        name: "Admin User",
        password: "admin123", // In production, this should be hashed
        role: "admin",
        isActive: true,
        createdAt: new Date().toISOString()
      }
    ]

    try {
      await azureStorage.setGlobalData('system', { users: demoUsers })
    } catch (error) {
      console.log("Azure not available, using localStorage")
    }
    
    localStorage.setItem(STORAGE_KEYS.SYSTEM_USERS, JSON.stringify(demoUsers))
    console.log("Demo data initialized")
  }
}
