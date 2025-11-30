"use client"

import { useState, useEffect } from "react"
import { getCurrentUser, getCurrentUserData, setCurrentUserData, clearCurrentUser } from "@/lib/storage"

export function AllocationGrid() {
  const [currentUser, setCurrentUserState] = useState<string | null>(null)
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null)
  const [projects, setProjects] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [allocations, setAllocations] = useState<any[]>([])

  // Load user data on component mount
  useEffect(() => {
    const loadData = async () => {
      const user = getCurrentUser()
      if (!user) {
        window.location.href = "/login"
        return
      }
      
      setCurrentUserState(user)
      
      try {
        const userData = await getCurrentUserData()
        setProjects(userData.projects || [])
        setUsers(userData.users || [
          { id: "1", name: "John Doe", department: "Engineering" },
          { id: "2", name: "Jane Smith", department: "Design" },
          { id: "3", name: "Bob Johnson", department: "Product" },
        ])
        setAllocations(userData.allocations || [])
      } catch (error) {
        console.error("Failed to load data:", error)
      }
    }
    
    loadData()
  }, [])

  // Save data whenever it changes
  useEffect(() => {
    if (currentUser && projects.length > 0) {
      setCurrentUserData({ projects })
    }
  }, [projects, currentUser])

  useEffect(() => {
    if (currentUser && users.length > 0) {
      setCurrentUserData({ users })
    }
  }, [users, currentUser])

  useEffect(() => {
    if (currentUser) {
      setCurrentUserData({ allocations })
    }
  }, [allocations, currentUser])

  const [selectedMonth, setSelectedMonth] = useState<number | null>(null)
  const [startMonth, setStartMonth] = useState<number>(0)
  const [startYear, setStartYear] = useState<number>(2024)
  const [viewMode, setViewMode] = useState<'percentage' | 'days'>('percentage')

  // Generate months array
  const generateMonths = () => {
    const months = []
    for (let i = 0; i < 12; i++) {
      const date = new Date(startYear, startMonth + i, 1)
      months.push({
        year: date.getFullYear(),
        month: date.getMonth(),
        display: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        globalIndex: startMonth + i
      })
    }
    return months
  }

  const months = generateMonths()

  const getWorkingDaysInMonth = (year: number, month: number, startDay: number) => {
    const date = new Date(year, month, 1)
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    let workingDays = 0
    
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDay = new Date(year, month, day).getDay()
      if (startDay === 1) { // Monday-Friday
        if (currentDay >= 1 && currentDay <= 5) workingDays++
      } else { // Sunday-Thursday
        if (currentDay >= 0 && currentDay <= 4) workingDays++
      }
    }
    
    return workingDays
  }

  const handleMonthClick = (monthIndex: number) => {
    setSelectedMonth(monthIndex)
  }

  const handleLogout = () => {
    if (currentUser) {
      setCurrentUserData({ startMonth, startYear })
    }
    clearCurrentUser()
    window.location.href = "/login"
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Resource Allocation</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode(viewMode === 'percentage' ? 'days' : 'percentage')}
              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
            >
              View: {viewMode === 'percentage' ? '%' : 'Days'}
            </button>
            <button
              onClick={() => {
                // Add project logic
                const projectName = prompt("Enter project name:")
                if (projectName) {
                  const newProject = {
                    id: Date.now().toString(),
                    name: projectName,
                    startMonth: startMonth,
                    startYear: startYear
                  }
                  setProjects([...projects, newProject])
                }
              }}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              + Project
            </button>
            <button
              onClick={() => {
                // Add staff logic
                const userName = prompt("Enter staff name:")
                const department = prompt("Enter department:")
                if (userName && department) {
                  const newUser = {
                    id: Date.now().toString(),
                    name: userName,
                    department: department
                  }
                  setUsers([...users, newUser])
                }
              }}
              className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
            >
              + Staff
            </button>
            <button
              onClick={() => {
                // Settings logic - show simple settings
                alert("Settings panel would open here")
              }}
              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
            >
              Settings
            </button>
            <button
              onClick={handleLogout}
              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
            >
              Logout
            </button>
          </div>
        </div>
        
        {/* Month/Year selectors */}
        <div className="flex gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Month</label>
            <select
              value={startMonth}
              onChange={(e) => setStartMonth(Number(e.target.value))}
              className="border border-gray-300 rounded px-2 py-1 text-sm"
            >
              {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map((month, index) => (
                <option key={month} value={index}>{month}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Year</label>
            <select
              value={startYear}
              onChange={(e) => setStartYear(Number(e.target.value))}
              className="border border-gray-300 rounded px-2 py-1 text-sm"
            >
              {[2023, 2024, 2025, 2026, 2027].map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Allocation Grid */}
      <div className="bg-white rounded-lg border border-gray-300 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr>
                <th className="border border-gray-300 p-2 bg-gray-100 w-42">Staff</th>
                {months.map((month, idx) => {
                  const monFriDays = getWorkingDaysInMonth(month.year, month.month, 1)
                  const sunThuDays = getWorkingDaysInMonth(month.year, month.month, 0)
                  return (
                    <th
                      key={idx}
                      className="border border-gray-300 p-2 bg-gray-100 w-32 cursor-pointer hover:bg-gray-200 text-sm"
                      onClick={() => handleMonthClick(month.globalIndex)}
                    >
                      <div className="flex flex-col items-center">
                        <div>{month.display}</div>
                        <div className="text-[10px] text-gray-600 mt-1">
                          <div>Mon-Fri: {monFriDays}</div>
                          <div>Sun-Thu: {sunThuDays}</div>
                        </div>
                      </div>
                    </th>
                  )
                })}
              </tr>
              <tr>
                <th className="border border-gray-300 bg-gray-50 w-42 text-xs text-gray-600">Unallocated</th>
                {months.map((month) => (
                  <th key={month.globalIndex} className="border border-gray-300 bg-gray-50 text-xs text-gray-600">
                    {/* Unallocated positions would go here */}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="border border-gray-300 p-2 bg-gray-50">
                    <div className="font-medium text-sm">{user.name}</div>
                    <div className="text-xs text-gray-600">{user.department}</div>
                  </td>
                  {months.map((month) => (
                    <td key={month.globalIndex} className="border border-gray-300 p-1">
                      <div className="w-full h-8 bg-gray-100 rounded border border-gray-300 flex items-center justify-center text-xs text-gray-600 cursor-pointer hover:bg-gray-200">
                        {viewMode === 'percentage' ? '0%' : '0 days'}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Project Summary */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Projects</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <div key={project.id} className="bg-white p-4 rounded-lg border border-gray-200">
              <h4 className="font-medium text-gray-900">{project.name}</h4>
              <p className="text-sm text-gray-500 mt-1">
                Start: {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][project.startMonth || 0]} {project.startYear || 2024}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
