import { NextRequest, NextResponse } from 'next/server'
import { azureStorageEnhanced } from '@/lib/azure-enhanced'
import fs from 'fs'
import path from 'path'

const DEBUG_WRITES_ALLOWED = process.env.ALLOW_DEBUG_WRITES === 'true'

export async function POST(request: NextRequest) {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    steps: [] as any[]
  }

  try {
    if (!DEBUG_WRITES_ALLOWED) {
      return NextResponse.json({ error: 'Debug writes are disabled. Set ALLOW_DEBUG_WRITES=true to enable.' }, { status: 403 })
    }

    const data = await request.json()
    // Audit log for debug/test write attempts
    try {
      const logPath = path.join(process.cwd(), 'azure-writes.log')
      const entry = {
        timestamp: new Date().toISOString(),
        route: '/api/test/enhanced-post',
        allowed: DEBUG_WRITES_ALLOWED,
        incomingCounts: {
          projects: data.projects?.length || 0,
          users: data.users?.length || 0
        },
        headers: Object.fromEntries(request.headers.entries())
      }
      fs.appendFileSync(logPath, JSON.stringify(entry) + '\n')
    } catch (e) {
      console.error('Failed to write azure-writes.log:', e)
    }
    diagnostics.steps.push({
      step: 'Parse request body',
      success: true,
      data: {
        projects: data.projects?.length || 0,
        users: data.users?.length || 0
      }
    })

    // Test enhanced storage directly
    diagnostics.steps.push({
      step: 'About to call azureStorageEnhanced.setMainData',
      success: true
    })

    await azureStorageEnhanced.setMainData(data)
    
    diagnostics.steps.push({
      step: 'setMainData completed successfully',
      success: true
    })

    return NextResponse.json({ 
      success: true,
      message: 'Enhanced storage test successful',
      diagnostics
    })
  } catch (error: any) {
    diagnostics.steps.push({
      step: 'Error occurred',
      success: false,
      error: error.message,
      stack: error.stack
    })

    return NextResponse.json(
      { 
        success: false,
        error: 'Enhanced storage test failed',
        diagnostics
      },
      { status: 500 }
    )
  }
}
