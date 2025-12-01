import { NextRequest, NextResponse } from 'next/server'
import { TableClient } from "@azure/data-tables"

export async function GET() {
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING || ""
  
  try {
    const tableClient = TableClient.fromConnectionString(connectionString, "soladata")
    const entities = tableClient.listEntities()
    
    const results = []
    for await (const entity of entities) {
      results.push({
        partitionKey: entity.partitionKey,
        rowKey: entity.rowKey,
        hasData: !!(entity as any).data,
        dataLength: ((entity as any).data || "").length,
        timestamp: entity.timestamp
      })
    }
    
    return NextResponse.json({
      success: true,
      entityCount: results.length,
      entities: results
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      statusCode: error.statusCode
    }, { status: 500 })
  }
}
