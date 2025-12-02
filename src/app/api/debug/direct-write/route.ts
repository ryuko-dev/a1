import { NextRequest, NextResponse } from 'next/server'
import { TableClient } from "@azure/data-tables"
import fs from 'fs'
import path from 'path'

// Guard: debug write endpoints are disabled by default. To enable, set
// environment variable `ALLOW_DEBUG_WRITES=true` (not recommended in production).
const DEBUG_WRITES_ALLOWED = process.env.ALLOW_DEBUG_WRITES === 'true'

export async function POST(request: NextRequest) {
  if (!DEBUG_WRITES_ALLOWED) {
    return NextResponse.json({ error: 'Debug writes are disabled. Set ALLOW_DEBUG_WRITES=true to enable.' }, { status: 403 })
  }

  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING || ""
  
  try {
    const testData = {
      projects: [{
        id: "test-write",
        name: "Write Test",
        color: "#00FF00"
      }],
      users: [],
      allocations: [],
      positions: [],
      entities: []
    }
    
    const tableClient = TableClient.fromConnectionString(connectionString, "soladata")
    
    const entity = {
      partitionKey: "globaldata",
      rowKey: "main",
      data: JSON.stringify(testData)
    }
    
    await tableClient.upsertEntity(entity)

    // Audit log: record debug write intent
    try {
      const logPath = path.join(process.cwd(), 'azure-writes.log')
      const entry = {
        timestamp: new Date().toISOString(),
        route: '/api/debug/direct-write',
        allowed: DEBUG_WRITES_ALLOWED,
        written: { projects: testData.projects.length }
      }
      fs.appendFileSync(logPath, JSON.stringify(entry) + '\n')
    } catch (e) {
      console.error('Failed to write azure-writes.log:', e)
    }
    
    // Verify the write
    const verifyEntity = await tableClient.getEntity("globaldata", "main")
    const verifyData = JSON.parse((verifyEntity as any).data || "{}")
    
    return NextResponse.json({
      success: true,
      message: "Entity written successfully",
      writtenData: testData,
      verifiedData: verifyData,
      matches: JSON.stringify(testData) === (verifyEntity as any).data
    })
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      statusCode: error.statusCode,
      stack: error.stack
    }, { status: 500 })
  }
}
