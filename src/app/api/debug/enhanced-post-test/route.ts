import { NextRequest, NextResponse } from 'next/server'
import { azureStorageEnhanced } from '@/lib/azure-enhanced'
import fs from 'fs'
import path from 'path'

const DEBUG_WRITES_ALLOWED = process.env.ALLOW_DEBUG_WRITES === 'true'

export async function POST(request: NextRequest) {
  try {
    if (!DEBUG_WRITES_ALLOWED) {
      return NextResponse.json({ error: 'Debug writes are disabled. Set ALLOW_DEBUG_WRITES=true to enable.' }, { status: 403 })
    }

    // Audit log for debug enhanced-post-test
    try {
      const logPath = path.join(process.cwd(), 'azure-writes.log')
      const entry = {
        timestamp: new Date().toISOString(),
        route: '/api/debug/enhanced-post-test',
        allowed: DEBUG_WRITES_ALLOWED,
        headers: Object.fromEntries(request.headers.entries())
      }
      fs.appendFileSync(logPath, JSON.stringify(entry) + '\n')
    } catch (e) {
      console.error('Failed to write azure-writes.log:', e)
    }

    console.log('[DEBUG] Starting enhanced storage POST test...')
    
    // Test 1: Get singleton instance
    const instance = azureStorageEnhanced
    console.log('[DEBUG] Got singleton instance:', !!instance)
    
    // Test 2: Try to call setMainData with simple data
    const testData = {
      projects: [{
        id: "test-enhanced-post",
        name: "Enhanced POST Test",
        color: "#FF00FF"
      }],
      users: [],
      allocations: [],
      positions: [],
      entities: []
    }
    
    console.log('[DEBUG] About to call setMainData...')
    await instance.setMainData(testData)
    console.log('[DEBUG] setMainData completed successfully')
    
    // Test 3: Verify by reading back
    const readData = await instance.getMainData()
    console.log('[DEBUG] Read back data:', readData.projects?.length || 0, 'projects')
    
    return NextResponse.json({
      success: true,
      message: 'Enhanced storage POST test successful',
      writtenProjects: testData.projects.length,
      readProjects: readData.projects?.length || 0,
      projectsMatch: testData.projects[0].id === readData.projects?.[0]?.id
    })
    
  } catch (error: any) {
    console.error('[DEBUG] Enhanced storage POST test failed:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
