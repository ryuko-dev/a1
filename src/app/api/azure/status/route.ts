import { NextRequest, NextResponse } from 'next/server'
import { azureStorageEnhanced } from '@/lib/azure-enhanced'

export async function GET() {
  try {
    const status = azureStorageEnhanced.getAzureStatus()
    return NextResponse.json(status)
  } catch (error) {
    console.error('[API] Error getting Azure status:', error)
    return NextResponse.json(
      { error: 'Failed to get Azure status' },
      { status: 500 }
    )
  }
}
