"use client"

import { useState, useEffect } from "react"
import { Navigation } from "@/components/navigation"
import { getCurrentUser, getCurrentUserData, setCurrentUserData } from "@/lib/storage"

export default function PlanningPage() {
  const [currentUser, setCurrentUserState] = useState<string | null>(null)
  const [projects, setProjects] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])

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
        setUsers(userData.users || [])
      } catch (error) {
        console.error("Failed to load data:", error)
      }
    }
    
    loadData()
  }, [])

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

  return (
    <main className="min-h-screen bg-white">
      <Navigation currentPage="/planning" />
      <div className="p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Planning</h2>
        
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Planning</h3>
          <p className="text-gray-600">Planning page content will be added here.</p>
          
          {/* Demo content */}
          <div className="mt-6">
            <h4 className="font-medium text-gray-900 mb-2">Current Projects</h4>
            {projects.length === 0 ? (
              <p className="text-gray-500">No projects yet. Add projects to get started.</p>
            ) : (
              <div className="space-y-2">
                {projects.map((project) => (
                  <div key={project.id} className="p-3 border border-gray-200 rounded">
                    <h5 className="font-medium">{project.name}</h5>
                    <p className="text-sm text-gray-600">
                      Start: {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][project.startMonth || 0]} {project.startYear || 2024}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
