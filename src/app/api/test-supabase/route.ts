import { NextResponse } from 'next/server'
import { testSupabaseConnection } from '@/lib/supabase'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    // Test Supabase connection
    const supabaseTest = await testSupabaseConnection()
    
    // Test Prisma connection
    let prismaTest
    try {
      await prisma.$connect()
      await prisma.$queryRaw`SELECT 1 as test`
      prismaTest = { success: true, message: 'Prisma connection successful' }
    } catch (error) {
      prismaTest = { 
        success: false, 
        message: `Prisma connection failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      }
    } finally {
      await prisma.$disconnect()
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      tests: {
        supabase: supabaseTest,
        prisma: prismaTest
      },
      overall: supabaseTest.success && prismaTest.success ? 'success' : 'partial_failure'
    })

  } catch (error) {
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      overall: 'failure'
    }, { status: 500 })
  }
}