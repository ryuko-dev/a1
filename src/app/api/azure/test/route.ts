import { NextResponse } from 'next/server'
import { azureStorageEnhanced } from '@/lib/azure-enhanced'

export async function GET() {
  try {
    console.log('[Test] Starting Azure enhanced connection test...')
    
    // Test Azure status
    const status = azureStorageEnhanced.getAzureStatus()
    console.log('[Test] Azure enhanced status:', status)
    
    // Test table initialization
    let initTableError = null
    try {
      console.log('[Test] Initializing enhanced tables...')
      await azureStorageEnhanced.initializeTables()
      console.log('[Test] Enhanced tables initialization successful')
    } catch (error: any) {
      console.error('[Test] Enhanced tables initialization failed:', error.message)
      initTableError = error.message
    }
    
    // Test connection through azureStorageEnhanced
    let connectionTest = false
    try {
      connectionTest = await azureStorageEnhanced.testConnection()
      console.log('[Test] AzureStorageEnhanced connection test result:', connectionTest)
    } catch (error: any) {
      console.log('[Test] AzureStorageEnhanced connection test failed:', error.message)
    }
    
    // Test basic operations
    let getDataError = null
    try {
      await azureStorageEnhanced.getGlobalData()
      console.log('[Test] getGlobalData successful')
    } catch (error: any) {
      console.log('[Test] getGlobalData failed:', error.message)
      getDataError = error.message
    }
    
    return NextResponse.json({
      status,
      connectionTest,
      initTableError,
      getDataError,
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('[Test] Test failed:', error)
    return NextResponse.json(
      { 
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
