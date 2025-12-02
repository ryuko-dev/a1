import { NextRequest, NextResponse } from 'next/server'
import { azureStorageEnhanced } from '@/lib/azure-enhanced'

export async function GET() {
  try {
    console.log('[API] GET /api/azure/enhanced/lock-state/all - Listing lock months')
    const list = await azureStorageEnhanced.listLockStates()
    return NextResponse.json({ months: list })
  } catch (error) {
    console.error('[API] GET /api/azure/enhanced/lock-state/all - Error:', error)
    return NextResponse.json({ error: 'Failed to list lock states' }, { status: 500 })
  }
}
