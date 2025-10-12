import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'

export async function GET(request: NextRequest) {
  try {
    console.log('=== VERIFICANDO ESTRUTURA DA TABELA SUBSCRIPTIONS ===')

    const supabase = createClient()

    // 1. Verificar se a tabela existe
    const { data: tableExists, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'subscriptions')

    if (tableError) {
      console.error('Erro ao verificar se tabela existe:', tableError)
      return NextResponse.json(
        {
          success: false,
          error: 'Erro ao verificar estrutura da tabela',
          details: tableError,
        },
        { status: 500 }
      )
    }

    if (!tableExists || tableExists.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Tabela subscriptions não existe',
          message:
            'Execute a migração: supabase/migrations/20250104_create_subscriptions_table.sql',
        },
        { status: 404 }
      )
    }

    console.log('✅ Tabela subscriptions existe')

    // 2. Verificar estrutura da tabela
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_schema', 'public')
      .eq('table_name', 'subscriptions')
      .order('ordinal_position')

    if (columnsError) {
      console.error('Erro ao verificar colunas:', columnsError)
      return NextResponse.json(
        {
          success: false,
          error: 'Erro ao verificar colunas da tabela',
          details: columnsError,
        },
        { status: 500 }
      )
    }

    console.log('✅ Colunas da tabela:', columns)

    // 3. Verificar se há dados na tabela
    const { data: subscriptions, error: dataError } = await supabase
      .from('subscriptions')
      .select('*')
      .limit(5)

    if (dataError) {
      console.error('Erro ao verificar dados:', dataError)
      return NextResponse.json(
        {
          success: false,
          error: 'Erro ao verificar dados da tabela',
          details: dataError,
        },
        { status: 500 }
      )
    }

    console.log('✅ Dados da tabela:', subscriptions)

    // 4. Verificar tipos de dados específicos
    const expectedColumns = [
      'id',
      'user_id',
      'status',
      'plan_type',
      'price_id',
      'subscription_id',
      'current_period_start',
      'current_period_end',
      'cancel_at_period_end',
      'explicacao_pratica',
      'created_at',
      'updated_at',
    ]

    const existingColumns = columns?.map(col => col.column_name) || []
    const missingColumns = expectedColumns.filter(col => !existingColumns.includes(col))

    // 5. Verificar tipos de dados críticos
    const criticalColumns = [
      { name: 'current_period_start', expectedType: 'timestamp with time zone' },
      { name: 'current_period_end', expectedType: 'timestamp with time zone' },
      { name: 'status', expectedType: 'text' },
      { name: 'explicacao_pratica', expectedType: 'boolean' },
    ]

    const typeIssues: Array<{
      column: string
      expected: string
      actual: any
    }> = []
    criticalColumns.forEach(critical => {
      const column = columns?.find(col => col.column_name === critical.name)
      if (column && column.data_type !== critical.expectedType) {
        typeIssues.push({
          column: critical.name,
          expected: critical.expectedType,
          actual: column.data_type,
        })
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        tableExists: true,
        columns: columns,
        subscriptions: subscriptions,
        missingColumns,
        typeIssues,
        summary: {
          totalColumns: columns?.length || 0,
          expectedColumns: expectedColumns.length,
          missingColumns: missingColumns.length,
          typeIssues: typeIssues.length,
          totalSubscriptions: subscriptions?.length || 0,
        },
      },
    })
  } catch (error) {
    console.error('Erro geral na verificação:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    )
  }
}
