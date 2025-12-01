import { NextRequest, NextResponse } from 'next/server'
import { azureStorageEnhanced } from '@/lib/azure-enhanced'

export async function POST(request: NextRequest) {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    steps: [] as any[]
  }

  try {
    const data = await request.json()
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
