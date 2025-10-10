import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ message: 'API de teste funcionando' })
}

export async function POST(req: Request) {
  return NextResponse.json({ message: 'POST funcionando', body: await req.json() })
}
