import { NextRequest, NextResponse } from 'next/server'
import { azureStorageEnhanced } from '@/lib/azure-enhanced'
import fs from 'fs'
import path from 'path'

export async function GET() {
  try {
    console.log('[API] GET /api/azure/enhanced/main - Fetching main data')
    const data = await azureStorageEnhanced.getMainData()
    console.log('[API] GET /api/azure/enhanced/main - Success:', {
      projects: data.projects?.length || 0,
      users: data.users?.length || 0,
      allocations: data.allocations?.length || 0,
      positions: data.positions?.length || 0,
      entities: data.entities?.length || 0
    })
    return NextResponse.json(data)
  } catch (error) {
    console.error('[API] GET /api/azure/enhanced/main - Error:', error)
    return NextResponse.json(
      { error: 'Failed to get main data' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const clientLast = request.headers.get('x-client-lastmodified') || data.clientLastModified || null
    const bypassConcurrency = request.headers.get('x-bypass-concurrency') === 'true'
    const allowDeletions = request.headers.get('x-allow-deletions') === 'true'

    // Detailed audit logging of incoming write attempts
    try {
      const logPath = path.join(process.cwd(), 'azure-writes.log')
      const entry = {
        timestamp: new Date().toISOString(),
        route: '/api/azure/enhanced/main',
        incomingCounts: {
          projects: data.projects?.length || 0,
          users: data.users?.length || 0,
          allocations: data.allocations?.length || 0,
          positions: data.positions?.length || 0,
          entities: data.entities?.length || 0
        },
        headers: Object.fromEntries(request.headers.entries())
      }
      fs.appendFileSync(logPath, JSON.stringify(entry) + '\n')
    } catch (e) {
      console.error('[API] Failed to write azure-writes.log:', e)
    }

    console.log('[API] 🔴 POST /api/azure/enhanced/main - Raw request data:', data)
    console.log('[API] 🔴 POST /api/azure/enhanced/main - clientLastModified header:', clientLast)
    // Check optimistic concurrency: compare clientLast with server lastModified
    // Skip if bypassConcurrency is true
    if (!bypassConcurrency) {
      try {
        const existing = await azureStorageEnhanced.getMainData()
        const serverLast = (existing as any).lastModified || null
        if (clientLast && serverLast) {
          const clientDate = new Date(clientLast)
          const serverDate = new Date(serverLast)
          if (clientDate.getTime() < serverDate.getTime()) {
            console.error('[API] POST /api/azure/enhanced/main - Conflict: client data is older than server')
            return NextResponse.json({ error: 'Conflict: server has newer data' }, { status: 409 })
          }
        }
      } catch (e) {
        console.error('[API] POST /api/azure/enhanced/main - Failed to perform optimistic check:', e)
      }
    } else {
      console.log('[API] POST /api/azure/enhanced/main - Skipping optimistic concurrency check (bypass enabled)')
    }
    
    const totalItems = (data.projects?.length || 0) + (data.users?.length || 0) + (data.allocations?.length || 0) + (data.positions?.length || 0) + (data.entities?.length || 0)
    console.log('[API] 🔴 POST /api/azure/enhanced/main - Total items:', totalItems)
    
    if (totalItems === 0) {
      console.error('[API] 🚨 CRITICAL: Received EMPTY data request! This will overwrite existing data!')
      console.error('[API] 🚨 Request headers:', Object.fromEntries(request.headers.entries()))
      console.error('[API] 🚨 Request body:', JSON.stringify(data, null, 2))
      // Don't save empty data
      return NextResponse.json(
        { error: 'Cannot save empty data' },
        { status: 400 }
      )
    }
    
    console.log('[API] POST /api/azure/enhanced/main - Saving main data:', {
      projects: data.projects?.length || 0,
      users: data.users?.length || 0,
      allocations: data.allocations?.length || 0,
      positions: data.positions?.length || 0,
      entities: data.entities?.length || 0,
      stackTrace: new Error().stack?.split('\n').slice(1, 5).join('\n')
    })
    
    await azureStorageEnhanced.setMainData(data, allowDeletions)
    console.log('[API] POST /api/azure/enhanced/main - Main data saved successfully')
    
    return NextResponse.json({ 
      success: true,
      message: 'Main data saved successfully'
    })
  } catch (error) {
    console.error('[API] POST /api/azure/enhanced/main - Error:', error)
    return NextResponse.json(
      { error: 'Failed to save main data' },
      { status: 500 }
    )
  }
}
