import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const name = searchParams.get('name') || 'mundo'

  return NextResponse.json({
    message: `Olá, ${name}!`,
  })
}
