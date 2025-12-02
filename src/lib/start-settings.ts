import { getCurrentUserData, updateUserSettings } from "./storage-enhanced"

export type StartGroup = 'allocPlanning' | 'expensePayroll'

const LOCAL_KEYS: Record<StartGroup, string> = {
  allocPlanning: 'sola-start-alloc-planning',
  expensePayroll: 'sola-start-expense-payroll'
}

// Read persisted start month/year for a given group. Falls back to user data or current month/year.
export async function getStartForGroup(group: StartGroup): Promise<{ month: number; year: number }> {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(LOCAL_KEYS[group])
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        if (typeof parsed.month === 'number' && typeof parsed.year === 'number') {
          return { month: parsed.month, year: parsed.year }
        }
      } catch (error) {
        console.error('Failed to parse start settings from localStorage:', error)
      }
    }
  }

  try {
    const userData = await getCurrentUserData()
    // Prefer group-specific persisted fields if present
    if (group === 'allocPlanning') {
      const m = (userData as any).startMonth_allocPlanning ?? userData.startMonth
      const y = (userData as any).startYear_allocPlanning ?? userData.startYear
      if (typeof m === 'number' && typeof y === 'number') return { month: m, year: y }
    } else {
      const m = (userData as any).startMonth_expensePayroll ?? userData.startMonth
      const y = (userData as any).startYear_expensePayroll ?? userData.startYear
      if (typeof m === 'number' && typeof y === 'number') return { month: m, year: y }
    }
  } catch (error) {
    console.error('Failed to load start settings from user data:', error)
  }

  const now = new Date()
  return { month: now.getMonth(), year: now.getFullYear() }
}

// Persist start month/year for a group: update localStorage for immediate cross-page reading,
// and persist to user settings via updateUserSettings so the choice is retained for the user.
export async function setStartForGroup(group: StartGroup, month: number, year: number): Promise<void> {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(LOCAL_KEYS[group], JSON.stringify({ month, year }))
    } catch (error) {
      console.error('Failed to write start settings to localStorage:', error)
    }
  }

  // Persist group-specific fields to server-side user settings to avoid overwriting other data
  try {
    if (group === 'allocPlanning') {
      await updateUserSettings({ startMonth_allocPlanning: month, startYear_allocPlanning: year } as any)
    } else {
      await updateUserSettings({ startMonth_expensePayroll: month, startYear_expensePayroll: year } as any)
    }
  } catch (error) {
    console.error('Failed to persist start settings to user settings:', error)
  }
}
