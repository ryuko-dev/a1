import { NextRequest, NextResponse } from 'next/server'
import { TableClient, TableServiceClient, AzureSASCredential } from "@azure/data-tables"

// Azure configuration
const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING || ""
const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME || "sola1"
const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY || ""

export async function GET() {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    env: {
      hasConnectionString: !!connectionString,
      connectionStringLength: connectionString.length,
      accountName,
      hasAccountKey: !!accountKey,
      accountKeyLength: accountKey.length
    },
    tests: [] as any[]
  }

  try {
    // Test 1: Connection string approach
    console.log('[DIAG] Testing connection string approach...')
    try {
      const tableService = TableServiceClient.fromConnectionString(connectionString)
      const tables = tableService.listTables()
      let tableCount = 0
      for await (const table of tables) {
        tableCount++
        console.log(`[DIAG] Found table: ${table.name}`)
      }
      diagnostics.tests.push({
        name: 'Connection String - List Tables',
        success: true,
        tableCount,
        message: `Found ${tableCount} tables`
      })

      // Test creating a table client
      const tableClient = TableClient.fromConnectionString(connectionString, "soladata")
      diagnostics.tests.push({
        name: 'Connection String - Table Client',
        success: true,
        message: 'Table client created successfully'
      })

      // Test querying the table
      try {
        const entities = tableClient.listEntities()
        let entityCount = 0
        for await (const entity of entities) {
          entityCount++
        }
        diagnostics.tests.push({
          name: 'Connection String - Query Entities',
          success: true,
          entityCount,
          message: `Found ${entityCount} entities`
        })
      } catch (queryError: any) {
        diagnostics.tests.push({
          name: 'Connection String - Query Entities',
          success: false,
          error: queryError.message,
          statusCode: queryError.statusCode
        })
      }

    } catch (csError: any) {
      diagnostics.tests.push({
        name: 'Connection String - General',
        success: false,
        error: csError.message,
        statusCode: csError.statusCode
      })
    }

    // Test 2: Separate credentials approach
    console.log('[DIAG] Testing separate credentials approach...')
    try {
      const tableService = new TableServiceClient(
        `https://${accountName}.table.core.windows.net`,
        new AzureSASCredential(accountKey)
      )
      const tables = tableService.listTables()
      let tableCount = 0
      for await (const table of tables) {
        tableCount++
      }
      diagnostics.tests.push({
        name: 'Separate Credentials - List Tables',
        success: true,
        tableCount,
        message: `Found ${tableCount} tables`
      })
    } catch (scError: any) {
      diagnostics.tests.push({
        name: 'Separate Credentials - General',
        success: false,
        error: scError.message,
        statusCode: scError.statusCode
      })
    }

  } catch (error: any) {
    diagnostics.tests.push({
      name: 'General Diagnostic Error',
      success: false,
      error: error.message,
      stack: error.stack
    })
  }

  return NextResponse.json(diagnostics)
}
