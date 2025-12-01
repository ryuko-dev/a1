import { NextRequest, NextResponse } from 'next/server'
import { TableClient } from "@azure/data-tables"

export async function POST(request: NextRequest) {
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
