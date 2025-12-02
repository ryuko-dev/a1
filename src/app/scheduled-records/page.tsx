"use client"

import * as React from "react"
import { Navigation } from "@/components/navigation"
import { canEditPage, UserRole } from "@/lib/permissions"
import { getCurrentSystemUser } from "@/lib/storage-enhanced"
// using group-specific start-settings for persistence
import { Button } from "@/components/ui/button"

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
]

interface ScheduledRecord {
  id: string
  purchaseDate: string
  description: string
  currency: string
  amount: number
  usdAmount: number
  usefulMonths: number
  monthlyCost: number
  disposalDate?: string
  isFinished: boolean
  isEditing?: boolean
}

export default function ScheduledRecordsPage() {
  const [currentUserRole, setCurrentUserRole] = React.useState<UserRole | null>(null)
  
  // Initialize with shared month/year state (expense/scheduled/payroll group)
  const [selectedMonth, setSelectedMonth] = React.useState<number>(() => {
    if (typeof window !== 'undefined') {
      const storedGroup = localStorage.getItem('sola-start-expense-payroll')
      if (storedGroup) {
        try {
          const parsed = JSON.parse(storedGroup)
          if (typeof parsed.month === 'number') return parsed.month
        } catch {}
      }
      const stored = localStorage.getItem('sola-selected-month')
      if (stored) return Number(stored)
      return new Date().getMonth()
    }
    return new Date().getMonth()
  })

  const [selectedYear, setSelectedYear] = React.useState<number>(() => {
    if (typeof window !== 'undefined') {
      const storedGroup = localStorage.getItem('sola-start-expense-payroll')
      if (storedGroup) {
        try {
          const parsed = JSON.parse(storedGroup)
          if (typeof parsed.year === 'number') return parsed.year
        } catch {}
      }
      const stored = localStorage.getItem('sola-selected-year')
      if (stored) return Number(stored)
      return new Date().getFullYear()
    }
    return new Date().getFullYear()
  })
  
  const [selectedEntity, setSelectedEntity] = React.useState<string | null>(null)
  const [showEntityUsers, setShowEntityUsers] = React.useState<boolean>(false)
  const [descriptionFilter, setDescriptionFilter] = React.useState<string>('')
  const [showFinished, setShowFinished] = React.useState<boolean>(false)
  const [collapsedTables, setCollapsedTables] = React.useState<Record<string, boolean>>(() => {
  // Initialize all tables as collapsed by default
  const initialCollapsed: Record<string, boolean> = {}
  const tableConfigs = [
    { key: 'fixed-asset', name: 'Fixed Asset', accountCode: '' },
    { key: 'prepaid-rent', name: 'Prepaid Rent', accountCode: '471 9005' },
    { key: 'prepaid-expenses', name: 'Prepaid Expenses', accountCode: '471 9002' },
    { key: 'other-insurances', name: 'Other Insurances', accountCode: '471 9001' },
    { key: 'life-insurance', name: 'Life Insurance', accountCode: '471 9004' },
    { key: 'medical-insurance', name: 'Medical Insurance', accountCode: '471 9003' }
  ]
  tableConfigs.forEach(config => {
    initialCollapsed[config.key] = true
  })
  return initialCollapsed
})
  const [tableRecords, setTableRecords] = React.useState<Record<string, ScheduledRecord[]>>({})
  const [isClient, setIsClient] = React.useState<boolean>(false)

  // Update shared state when month/year changes
  const updateMonthYear = React.useCallback((month: number, year: number) => {
    setSelectedMonth(month)
    setSelectedYear(year)
    import('@/lib/start-settings').then(({ setStartForGroup }) => {
      setStartForGroup('expensePayroll', month, year).catch(err => console.error('Failed to save group start:', err))
    }).catch(err => console.error('Failed to load start-settings:', err))
  }, [])

  // Persist selected month/year to group-specific storage when they change
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const groupKey = JSON.stringify({ month: selectedMonth, year: selectedYear })
        localStorage.setItem('sola-start-expense-payroll', groupKey)
      } catch (err) {
        console.error('Failed to write group start key to localStorage:', err)
      }
    }
  }, [selectedMonth, selectedYear])

  // Handle client-side hydration
  React.useEffect(() => {
    setIsClient(true)
    
    // Load user role
    const loadUserRole = async () => {
      const systemUser = await getCurrentSystemUser()
      if (systemUser) {
        setCurrentUserRole(systemUser.role)
      }
    }
    loadUserRole()
  }, [])

  // Load persisted group start settings on mount
  React.useEffect(() => {
    const load = async () => {
      try {
        const { getStartForGroup } = await import('@/lib/start-settings')
        const { month, year } = await getStartForGroup('expensePayroll')
        setSelectedMonth(month)
        setSelectedYear(year)
      } catch (error) {
        console.error('Failed to load expense group start settings:', error)
      }
    }
    load()
  }, [])

  // Load records from Azure storage for each table
  React.useEffect(() => {
    const loadRecords = async () => {
      try {
        const allTableRecords: Record<string, ScheduledRecord[]> = {}
        tableConfigs.forEach(config => {
          allTableRecords[config.key] = []
        })
        setTableRecords(allTableRecords)
      } catch (error) {
        console.error('Error loading records:', error)
        const allTableRecords: Record<string, ScheduledRecord[]> = {}
        tableConfigs.forEach(config => {
          allTableRecords[config.key] = []
        })
        setTableRecords(allTableRecords)
      }
    }
    
    if (isClient) {
      loadRecords()
    }
  }, [isClient])

  // Add new record to a specific table
  const addRecord = (tableKey: string) => {
    const newRecord: ScheduledRecord = {
      id: Date.now().toString(),
      purchaseDate: new Date().toISOString().split('T')[0],
      description: '',
      currency: 'USD',
      amount: 0,
      usdAmount: 0,
      usefulMonths: 12,
      monthlyCost: 0,
      disposalDate: '',
      isFinished: false,
      isEditing: true
    }
    
    setTableRecords(prev => ({
      ...prev,
      [tableKey]: [...(prev[tableKey] || []), newRecord]
    }))
  }

  // Update record in a specific table
  const updateRecord = (tableKey: string, recordId: string, field: keyof ScheduledRecord, value: any) => {
    setTableRecords(prev => ({
      ...prev,
      [tableKey]: prev[tableKey].map(record => {
        if (record.id === recordId) {
          const updatedRecord = { ...record, [field]: value }
          
          // Auto-calculate monthly cost and USD amount
          if (field === 'amount' || field === 'usdAmount' || field === 'usefulMonths') {
            const usdAmount = field === 'usdAmount' ? value : updatedRecord.usdAmount
            const usefulMonths = field === 'usefulMonths' ? value : updatedRecord.usefulMonths
            updatedRecord.monthlyCost = usefulMonths > 0 ? usdAmount / usefulMonths : 0
          }
          
          return updatedRecord
        }
        return record
      })
    }))
  }

  // Toggle edit mode for a record in a specific table
  const toggleEdit = (tableKey: string, recordId: string) => {
    setTableRecords(prev => ({
      ...prev,
      [tableKey]: prev[tableKey].map(record => 
        record.id === recordId ? { ...record, isEditing: !record.isEditing } : record
      )
    }))
  }

  // Save record (exit edit mode) in a specific table
  const saveRecord = (tableKey: string, recordId: string) => {
    setTableRecords(prev => ({
      ...prev,
      [tableKey]: prev[tableKey].map(record => 
        record.id === recordId ? { ...record, isEditing: false } : record
      )
    }))
  }

  // Delete record from a specific table
  const deleteRecord = (tableKey: string, recordId: string) => {
    setTableRecords(prev => ({
      ...prev,
      [tableKey]: prev[tableKey].filter(record => record.id !== recordId)
    }))
  }

  // Toggle table collapse
  const toggleCollapse = (tableKey: string) => {
    setCollapsedTables(prev => ({
      ...prev,
      [tableKey]: !prev[tableKey]
    }))
  }

  // Table configurations
  const tableConfigs = [
    { key: 'fixed-asset', name: 'Fixed Asset', accountCode: '' },
    { key: 'prepaid-rent', name: 'Prepaid Rent', accountCode: '471 9005' },
    { key: 'prepaid-expenses', name: 'Prepaid Expenses', accountCode: '471 9002' },
    { key: 'other-insurances', name: 'Other Insurances', accountCode: '471 9001' },
    { key: 'life-insurance', name: 'Life Insurance', accountCode: '471 9004' },
    { key: 'medical-insurance', name: 'Medical Insurance', accountCode: '471 9003' }
  ]

  // Calculate monthly allocations for a record
  const calculateMonthlyAllocations = (record: ScheduledRecord) => {
    const allocations: Record<string, number> = {}
    
    if (!record.purchaseDate || record.usefulMonths <= 0 || record.monthlyCost <= 0) {
      return allocations
    }

    // If disposal date is set, keep previous months same and allocate remaining to disposal month
    if (record.disposalDate) {
      const disposalDateObj = new Date(record.disposalDate)
      const purchaseDate = new Date(record.purchaseDate)
      
      // Calculate the month number for each date (0 = purchase month)
      const getMonthNumber = (date: Date) => {
        let yearDiff = date.getFullYear() - purchaseDate.getFullYear()
        let monthDiff = date.getMonth() - purchaseDate.getMonth()
        return yearDiff * 12 + monthDiff
      }
      
      const disposalMonthNumber = getMonthNumber(disposalDateObj)
      
      monthColumns.forEach(column => {
        const columnDate = new Date(column.year, column.month, 1)
        const columnMonthNumber = getMonthNumber(columnDate)
        
        if (columnMonthNumber < 0) {
          // Before purchase date: 0
          allocations[column.key] = 0
        } else if (columnMonthNumber < disposalMonthNumber) {
          // Before disposal date: normal monthly cost (if within useful months)
          if (columnMonthNumber < record.usefulMonths) {
            allocations[column.key] = record.monthlyCost
          } else {
            allocations[column.key] = 0
          }
        } else if (columnMonthNumber === disposalMonthNumber) {
          // Disposal month: remaining amount
          const monthsAllocatedBefore = Math.min(disposalMonthNumber, record.usefulMonths)
          const alreadyAllocated = monthsAllocatedBefore * record.monthlyCost
          const remainingAmount = record.usdAmount - alreadyAllocated
          allocations[column.key] = remainingAmount
        } else {
          // After disposal date: 0
          allocations[column.key] = 0
        }
      })
      
      return allocations
    }

    // Normal allocation logic
    const purchaseDate = new Date(record.purchaseDate)
    const startMonth = purchaseDate.getMonth()
    const startYear = purchaseDate.getFullYear()
    
    // Show allocation in every month column based on finished status
    monthColumns.forEach(column => {
      const columnDate = new Date(column.year, column.month, 1)
      
      // If not finished, show in all future months from purchase date
      if (!record.isFinished && columnDate >= purchaseDate) {
        let monthsElapsed = 0
        let currentMonth = startMonth
        let currentYear = startYear
        
        while (currentYear < column.year || (currentYear === column.year && currentMonth <= column.month)) {
          if (monthsElapsed < record.usefulMonths) {
            allocations[column.key] = record.monthlyCost
          } else {
            allocations[column.key] = 0 // Show 0 after useful months
          }
          monthsElapsed++
          currentMonth++
          if (currentMonth > 11) {
            currentMonth = 0
            currentYear++
          }
        }
      } else if (record.isFinished) {
        // If finished, don't show any allocations
        allocations[column.key] = 0
      } else {
        // Before purchase date
        allocations[column.key] = 0
      }
    })
    
    return allocations
  }

  // Calculate carried over amounts for each record (total of upcoming months)
  const calculateCarriedOver = (record: ScheduledRecord) => {
    const allocations = calculateMonthlyAllocations(record)
    let upcomingTotal = 0
    
    // Calculate total of upcoming months from selected month filter
    const selectedDate = new Date(selectedYear, selectedMonth, 1)
    const purchaseDate = new Date(record.purchaseDate)
    
    // Only calculate for records that are not finished and purchase date is before or at selected month
    if (!record.isFinished && purchaseDate <= selectedDate) {
      monthColumns.forEach(column => {
        const columnDate = new Date(column.year, column.month, 1)
        
        // Add allocations for this month and all future months
        if (columnDate >= selectedDate && allocations[column.key] && allocations[column.key] > 0) {
          upcomingTotal += allocations[column.key]
        }
      })
    }
    
    return upcomingTotal
  }

  // Generate 12 month columns starting from selected month
  const generateMonthColumns = () => {
    const columns = []
    let currentMonth = selectedMonth
    let currentYear = selectedYear
    
    for (let i = 0; i < 12; i++) {
      const monthKey = `${currentYear}-${currentMonth}`
      columns.push({
        key: monthKey,
        label: `${MONTHS[currentMonth].substring(0, 3)} ${currentYear.toString().substring(2)}`,
        month: currentMonth,
        year: currentYear
      })
      
      currentMonth++
      if (currentMonth > 11) {
        currentMonth = 0
        currentYear++
      }
    }
    
    return columns
  }

  const monthColumns = generateMonthColumns()

  // Check if current user has permission for editing
  const canEdit = currentUserRole ? canEditPage(currentUserRole) : false

  // Render a single table
  const renderTable = (config: typeof tableConfigs[0]) => {
    const isCollapsed = collapsedTables[config.key] || false
    const currentRecords = tableRecords[config.key] || []
    
    // Calculate remaining balance as of selected date
    const calculateRemainingBalance = () => {
      let totalRemaining = 0
      const selectedDate = new Date(selectedYear, selectedMonth, 1)
      
      currentRecords.forEach(record => {
        // Skip finished records
        if (record.isFinished) return
        
        const allocations = calculateMonthlyAllocations(record)
        
        // Add allocations for selected month and all future months
        monthColumns.forEach((column, index) => {
          const columnDate = new Date(column.year, column.month, 1)
          if (columnDate >= selectedDate) {
            totalRemaining += allocations[column.key] || 0
          }
        })
      })
      
      return totalRemaining
    }
    
    const remainingBalance = calculateRemainingBalance()
    
    // Filter records for this table
    const getFilteredRecords = () => {
      let filtered = currentRecords
      
      // Handle showFinished filter
      if (showFinished) {
        // Show all records when "Show Finished" is checked
        return filtered
      } else {
        // Show only unfinished records when "Show Finished" is unchecked
        return filtered.filter(record => !record.isFinished)
      }
    }

    const filteredRecords = getFilteredRecords()

    // Check if any record is in edit mode for this table
    const hasEditingRecord = currentRecords.some(record => record.isEditing)

    // Calculate totals for this table
    const calculateTotals = () => {
      const totals: Record<string, number> = { usdAmount: 0, monthlyCost: 0 }
      
      // Calculate USD Amount and Monthly Cost totals
      currentRecords.forEach(record => {
        totals.usdAmount += record.usdAmount
        totals.monthlyCost += record.monthlyCost
      })
      
      // Calculate totals for each month column
      monthColumns.forEach(column => {
        totals[column.key] = 0
        currentRecords.forEach(record => {
          const allocations = calculateMonthlyAllocations(record)
          totals[column.key] += allocations[column.key] || 0
        })
      })
      
      return totals
    }

    // Calculate balance for this table
    const calculateBalances = () => {
      const balances: Record<string, number> = {}
      
      monthColumns.forEach((column, index) => {
        let remainingTotal = 0
        currentRecords.forEach(record => {
          const allocations = calculateMonthlyAllocations(record)
          
          // Add allocations for this month and all future months
          for (let i = index; i < monthColumns.length; i++) {
            const futureColumn = monthColumns[i]
            remainingTotal += allocations[futureColumn.key] || 0
          }
        })
        
        balances[column.key] = remainingTotal
      })
      
      return balances
    }

    // Calculate total carried over for this table
    const calculateTotalCarriedOver = () => {
      let totalCarriedOver = 0
      currentRecords.forEach(record => {
        totalCarriedOver += calculateCarriedOver(record)
      })
      return totalCarriedOver
    }

    const totals = calculateTotals()
    const balances = calculateBalances()
    
    return (
      <div key={config.key} className="mb-3 border border-gray-300 rounded-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <button
              onClick={() => toggleCollapse(config.key)}
              className="flex items-center gap-2 px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
            >
              {isCollapsed ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                  Expand
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                  Collapse
                </>
              )}
            </button>
            <h3 className="text-xl font-bold text-gray-900">
              {config.name}
              {config.accountCode && <span className="ml-2 text-sm text-gray-500">({config.accountCode})</span>}
              <span className="ml-2 text-sm text-blue-600 font-medium">(${remainingBalance.toFixed(2)})</span>
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {canEdit && (
              <Button onClick={() => addRecord(config.key)} variant="outline" size="sm">
                + Add Record
              </Button>
            )}
          </div>
        </div>

        {!isCollapsed && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300 text-xs">
              <thead>
                <tr>
                  <th className="border border-gray-300 p-1 bg-gray-50 text-left text-xs font-semibold w-20">Purchase Date</th>
                  <th className="border border-gray-300 p-1 bg-gray-50 text-left text-xs font-semibold">Description</th>
                  <th className="border border-gray-300 p-1 bg-gray-50 text-left text-xs font-semibold w-16">Currency</th>
                  <th className="border border-gray-300 p-1 bg-gray-50 text-right text-xs font-semibold w-20">Amount</th>
                  <th className="border border-gray-300 p-1 bg-gray-50 text-right text-xs font-semibold w-20">USD Amount</th>
                  <th className="border border-gray-300 p-1 bg-gray-50 text-center text-xs font-semibold w-16">Useful</th>
                  <th className="border border-gray-300 p-1 bg-gray-50 text-right text-xs font-semibold w-20">Monthly</th>
                  <th className="border border-gray-300 p-1 bg-gray-50 text-right text-xs font-semibold w-20">Carried</th>
                  {hasEditingRecord && (
                    <th className="border border-gray-300 p-1 bg-gray-50 text-left text-xs font-semibold w-20">Disposal</th>
                  )}
                  {hasEditingRecord && (
                    <th className="border border-gray-300 p-1 bg-gray-50 text-center text-xs font-semibold w-12">Done</th>
                  )}
                  {monthColumns.map(column => (
                    <th key={`${config.key}-${column.key}`} className="border border-gray-300 p-1 bg-gray-50 text-right text-xs font-semibold whitespace-nowrap w-14">
                      {column.label}
                    </th>
                  ))}
                  <th className="border border-gray-300 p-1 bg-gray-50 text-center text-xs font-semibold w-16">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((record) => {
                  const allocations = calculateMonthlyAllocations(record)
                  const carriedOver = calculateCarriedOver(record)
                  const hasDisposalDate = record.disposalDate && record.disposalDate !== ''
                  const isFinished = record.isFinished
                  return (
                    <tr key={`${config.key}-${record.id}`} className={
                      hasDisposalDate ? 'bg-red-50' : 
                      isFinished ? 'bg-gray-100' : ''
                    }>
                      <td className="border border-gray-300 p-0.5 w-20">
                        {canEdit && record.isEditing ? (
                          <input
                            type="date"
                            value={record.purchaseDate}
                            onChange={(e) => updateRecord(config.key, record.id, 'purchaseDate', e.target.value)}
                            className="w-full border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500 rounded text-xs"
                          />
                        ) : (
                          <span className="text-xs">{record.purchaseDate}</span>
                        )}
                      </td>
                      <td className="border border-gray-300 p-0.5">
                        {canEdit && record.isEditing ? (
                          <input
                            type="text"
                            value={record.description}
                            onChange={(e) => updateRecord(config.key, record.id, 'description', e.target.value)}
                            className="w-full border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500 rounded text-xs"
                            placeholder="Enter description"
                          />
                        ) : (
                          <span className="text-xs">{record.description}</span>
                        )}
                      </td>
                      <td className="border border-gray-300 p-0.5 w-16">
                        {canEdit && record.isEditing ? (
                          <input
                            type="text"
                            value={record.currency}
                            onChange={(e) => updateRecord(config.key, record.id, 'currency', e.target.value)}
                            className="w-full border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500 rounded text-xs text-center"
                            placeholder="USD"
                            maxLength={3}
                          />
                        ) : (
                          <span className="text-xs text-center block">{record.currency}</span>
                        )}
                      </td>
                      <td className="border border-gray-300 p-0.5 w-20">
                        {canEdit && record.isEditing ? (
                          <input
                            type="number"
                            value={record.amount}
                            onChange={(e) => updateRecord(config.key, record.id, 'amount', parseFloat(e.target.value) || 0)}
                            className="w-full text-right border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500 rounded text-xs"
                            placeholder="0.00"
                            step="0.01"
                            min="0"
                          />
                        ) : (
                          <span className="text-xs text-right block">{record.amount.toFixed(2)}</span>
                        )}
                      </td>
                      <td className="border border-gray-300 p-0.5 w-20">
                        {canEdit && record.isEditing ? (
                          <input
                            type="number"
                            value={record.usdAmount}
                            onChange={(e) => updateRecord(config.key, record.id, 'usdAmount', parseFloat(e.target.value) || 0)}
                            className="w-full text-right border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500 rounded text-xs"
                            placeholder="0.00"
                            step="0.01"
                            min="0"
                          />
                        ) : (
                          <span className="text-xs text-right block">{record.usdAmount.toFixed(2)}</span>
                        )}
                      </td>
                      <td className="border border-gray-300 p-0.5 w-16">
                        {canEdit && record.isEditing ? (
                          <input
                            type="number"
                            value={record.usefulMonths}
                            onChange={(e) => updateRecord(config.key, record.id, 'usefulMonths', parseInt(e.target.value) || 1)}
                            className="w-full text-center border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500 rounded text-xs"
                            min="1"
                            max="360"
                          />
                        ) : (
                          <span className="text-xs">{record.usefulMonths}</span>
                        )}
                      </td>
                      <td className="border border-gray-300 p-0.5 w-20 text-right">
                        <span className="text-xs">{record.monthlyCost.toFixed(2)}</span>
                      </td>
                      <td className="border border-gray-300 p-0.5 w-20 text-right">
                        <span className="text-xs">{carriedOver.toFixed(2)}</span>
                      </td>
                      {hasEditingRecord && (
                        <td className="border border-gray-300 p-0.5 w-20">
                          {canEdit && record.isEditing ? (
                            <input
                              type="date"
                              value={record.disposalDate || ''}
                              onChange={(e) => updateRecord(config.key, record.id, 'disposalDate', e.target.value)}
                              className="w-full border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500 rounded text-xs"
                            />
                          ) : (
                            <span className="text-xs">{record.disposalDate || ''}</span>
                          )}
                        </td>
                      )}
                      {hasEditingRecord && (
                        <td className="border border-gray-300 p-0.5 w-12 text-center">
                          {canEdit && (
                            <input
                              type="checkbox"
                              checked={record.isFinished}
                              onChange={(e) => updateRecord(config.key, record.id, 'isFinished', e.target.checked)}
                              className="w-3 h-3 text-blue-600 rounded focus:ring-blue-500"
                            />
                          )}
                        </td>
                      )}
                      {monthColumns.map(column => (
                        <td key={`${config.key}-${column.key}`} className="border border-gray-300 p-0.5 text-right w-14">
                          <span className="text-xs">{allocations[column.key]?.toFixed(2) || ''}</span>
                        </td>
                      ))}
                      <td className="border border-gray-300 p-0.5 text-center w-16">
                        {canEdit && (
                          <>
                            {record.isEditing ? (
                              <div className="flex gap-1 justify-center">
                                <Button
                                  onClick={() => saveRecord(config.key, record.id)}
                                  variant="outline"
                                  size="sm"
                                  className="text-green-600 hover:text-green-800 text-xs px-1 py-0.5 h-5"
                                >
                                  Save
                                </Button>
                                <Button
                                  onClick={() => deleteRecord(config.key, record.id)}
                                  variant="outline"
                                  size="sm"
                                  className="text-red-600 hover:text-red-800 text-xs px-1 py-0.5 h-5"
                                >
                                  Del
                                </Button>
                              </div>
                            ) : (
                              <Button
                                onClick={() => toggleEdit(config.key, record.id)}
                                variant="outline"
                                size="sm"
                                className="text-blue-600 hover:text-blue-800 text-xs px-1 py-0.5 h-5"
                              >
                                Edit
                              </Button>
                            )}
                          </>
                        )}
                      </td>
                    </tr>
                  )
                })}
                
                {/* Totals Row */}
                <tr className="bg-gray-50 font-semibold">
                  <td className="border border-gray-300 p-0.5 text-xs text-center" colSpan={4}>Total</td>
                  <td className="border border-gray-300 p-0.5 text-right text-xs w-20">{totals.usdAmount.toFixed(2)}</td>
                  <td className="border border-gray-300 p-0.5 text-center text-xs w-16">-</td>
                  <td className="border border-gray-300 p-0.5 text-right text-xs w-20">{totals.monthlyCost.toFixed(2)}</td>
                  <td className="border border-gray-300 p-0.5 text-right text-xs w-20">{calculateTotalCarriedOver().toFixed(2)}</td>
                  {hasEditingRecord && (
                    <td className="border border-gray-300 p-0.5 text-center text-xs w-20">-</td>
                  )}
                  {hasEditingRecord && (
                    <td className="border border-gray-300 p-0.5 text-center text-xs w-12">-</td>
                  )}
                  {monthColumns.map(column => (
                    <td key={`total-${config.key}-${column.key}`} className="border border-gray-300 p-0.5 text-right text-xs w-14">
                      {totals[column.key]?.toFixed(2) || '0.00'}
                    </td>
                  ))}
                  <td className="border border-gray-300 p-0.5 text-center text-xs w-16">-</td>
                </tr>
                
                {/* Balance Row */}
                <tr className="bg-blue-50 font-semibold">
                  <td className="border border-gray-300 p-0.5 text-xs text-center" colSpan={8 + (hasEditingRecord ? 2 : 0)}>Balance (Remaining)</td>
                  {monthColumns.map(column => (
                    <td key={`balance-${config.key}-${column.key}`} className="border border-gray-300 p-0.5 text-right text-xs w-14">
                      {balances[column.key]?.toFixed(2) || '0.00'}
                    </td>
                  ))}
                  <td className="border border-gray-300 p-0.5 text-center text-xs w-16">-</td>
                </tr>
                
                {filteredRecords.length === 0 && (
                  <tr>
                    <td colSpan={8 + (hasEditingRecord ? 2 : 0) + monthColumns.length} className="border border-gray-300 p-8 text-center text-gray-500">
                      {showFinished 
                        ? 'No records found.' 
                        : 'No unfinished records found. Click \'Show Finished\' to see all records.'
                      }
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    )
  }

  if (!isClient) {
    return null
  }

  return (
    <main className="min-h-screen bg-background">
      <Navigation currentPage="/scheduled-records" />
      <div className="flex justify-between items-center mb-4 p-6">
        <h2 className="text-xl font-semibold text-gray-800">Scheduled Records</h2>
        <div className="flex gap-3 items-end">
          <div className="space-y-1">
            <label className="block text-xs font-medium">Start Month</label>
            <select
              value={selectedMonth}
              onChange={(e) => updateMonthYear(Number(e.target.value), selectedYear)}
              className="border border-gray-300 rounded px-2 py-1 text-sm"
            >
              {MONTHS.map((month, idx) => (
                <option key={idx} value={idx}>{month}</option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => updateMonthYear(selectedMonth, Number(e.target.value))}
              className="border border-gray-300 rounded px-2 py-1 text-sm"
            >
              {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i).map((year: number) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={showFinished}
                onChange={(e) => setShowFinished(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              Show Finished
            </label>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Render all tables */}
        {tableConfigs.map(config => renderTable(config))}
      </div>
    </main>
  )
}
