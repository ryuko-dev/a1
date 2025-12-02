import { NextRequest, NextResponse } from 'next/server'
import { azureStorageEnhanced } from '@/lib/azure-enhanced'

export async function GET() {
  try {
    console.log('[API] GET /api/azure/enhanced/monthly-allocation/all - Listing months')
    const list = await azureStorageEnhanced.listMonthlyAllocations()
    return NextResponse.json({ months: list })
  } catch (error) {
    console.error('[API] GET /api/azure/enhanced/monthly-allocation/all - Error:', error)
    return NextResponse.json({ error: 'Failed to list monthly allocations' }, { status: 500 })
  }
}
