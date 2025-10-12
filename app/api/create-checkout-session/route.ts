import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { divisionId } = await req.json()

    if (!divisionId) {
      return NextResponse.json({ error: 'divisionId é obrigatório' }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      checkoutUrl: `/api/direct-checkout?divisionId=${divisionId}`,
    })
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
