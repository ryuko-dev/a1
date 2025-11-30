"use client"

import { useState, useEffect } from "react"
import { Navigation } from "@/components/navigation"
import { getCurrentUser, getCurrentUserData, setCurrentUserData } from "@/lib/storage"

export default function ActualAllocationPage() {
  const [currentUser, setCurrentUserState] = useState<string | null>(null)
  const [allocations, setAllocations] = useState<any[]>([])

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
        setAllocations(userData.allocations || [])
      } catch (error) {
        console.error("Failed to load data:", error)
      }
    }
    
    loadData()
  }, [])

  useEffect(() => {
    if (currentUser) {
      setCurrentUserData({ allocations })
    }
  }, [allocations, currentUser])

  return (
    <main className="min-h-screen bg-white">
      <Navigation currentPage="/actual-allocation" />
      <div className="p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Payroll Allocation</h2>
        
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Actual Payroll Tracking</h3>
          <p className="text-gray-600">Payroll allocation tracking will be added here.</p>
          
          {/* Demo content */}
          <div className="mt-6">
            <h4 className="font-medium text-gray-900 mb-2">Current Allocations</h4>
            {allocations.length === 0 ? (
              <p className="text-gray-500">No allocations yet. Add allocations to get started.</p>
            ) : (
              <div className="space-y-2">
                {allocations.map((allocation) => (
                  <div key={allocation.id} className="p-3 border border-gray-200 rounded">
                    <h5 className="font-medium">Allocation {allocation.id}</h5>
                    <p className="text-sm text-gray-600">
                      User: {allocation.userId} | Project: {allocation.projectId} | {allocation.percentage}%
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
