import { NextRequest, NextResponse } from 'next/server'
import { TableClient } from "@azure/data-tables"

export async function GET() {
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING || ""
  
  try {
    const tableClient = TableClient.fromConnectionString(connectionString, "soladata")
    
    // Try to get the specific entity
    try {
      const entity = await tableClient.getEntity("globaldata", "main")
      const data = (entity as any).data
      
      return NextResponse.json({
        success: true,
        entity: {
          partitionKey: entity.partitionKey,
          rowKey: entity.rowKey,
          data: data,
          parsedData: JSON.parse(data || "{}")
        }
      })
    } catch (getError: any) {
      return NextResponse.json({
        success: false,
        error: "Failed to get entity",
        getError: getError.message,
        statusCode: getError.statusCode
      })
    }
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      statusCode: error.statusCode
    }, { status: 500 })
  }
}
