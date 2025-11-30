"use client"

import { useState, useEffect } from "react"
import { Navigation } from "@/components/navigation"
import { getCurrentUser, getCurrentUserData, setCurrentUserData } from "@/lib/storage"

export default function ExpenseAllocationPage() {
  const [currentUser, setCurrentUserState] = useState<string | null>(null)
  const [expenses, setExpenses] = useState<any[]>([])

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
        setExpenses(userData.expenses || [])
      } catch (error) {
        console.error("Failed to load data:", error)
      }
    }
    
    loadData()
  }, [])

  useEffect(() => {
    if (currentUser) {
      setCurrentUserData({ expenses })
    }
  }, [expenses, currentUser])

  return (
    <main className="min-h-screen bg-white">
      <Navigation currentPage="/expense-allocation" />
      <div className="p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Expense Allocation</h2>
        
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Expense Tracking</h3>
          <p className="text-gray-600">Expense allocation tracking will be added here.</p>
          
          {/* Demo content */}
          <div className="mt-6">
            <h4 className="font-medium text-gray-900 mb-2">Current Expenses</h4>
            {expenses.length === 0 ? (
              <p className="text-gray-500">No expenses yet. Add expenses to get started.</p>
            ) : (
              <div className="space-y-2">
                {expenses.map((expense) => (
                  <div key={expense.id} className="p-3 border border-gray-200 rounded">
                    <h5 className="font-medium">{expense.name}</h5>
                    <p className="text-sm text-gray-600">
                      Amount: ${expense.amount} | Category: {expense.category}
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
