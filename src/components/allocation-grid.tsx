"use client"

import { useState, useEffect } from "react"
import { getCurrentUser, getCurrentUserData, setCurrentUserData } from "@/lib/storage"

export function AllocationGrid() {
  const [currentUser, setCurrentUserState] = useState<string | null>(null)
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

  const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ]

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Resource Allocation</h2>
        
        {/* Month/Year selectors */}
        <div className="flex gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Month</label>
            <select
              value={startMonth}
              onChange={(e) => setStartMonth(Number(e.target.value))}
              className="border border-gray-300 rounded px-2 py-1 text-sm"
            >
              {MONTHS.map((month, index) => (
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
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User / Project
                </th>
                {MONTHS.map((month) => (
                  <th key={month} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">
                    {month.slice(0, 3)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {user.name}
                    <div className="text-xs text-gray-500">{user.department}</div>
                  </td>
                  {MONTHS.map((month, index) => (
                    <td key={month} className="px-4 py-3 text-center">
                      <div className="w-full h-8 bg-gray-100 rounded border border-gray-300 flex items-center justify-center text-xs text-gray-600">
                        0%
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
                Start: {MONTHS[project.startMonth || 0]} {project.startYear || 2024}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
