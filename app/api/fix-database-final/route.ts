import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'

export async function POST() {
  try {
    console.log('=== CORRIGINDO BANCO DE DADOS FINAL ===')

    const supabase = createClient()

    // 1. Verificar se tabela existe
    console.log('\n--- VERIFICANDO TABELA SUBSCRIPTIONS ---')
    const { data: tableCheck, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'subscriptions')

    if (tableError) {
      console.error('❌ Erro ao verificar tabela:', tableError)
      return NextResponse.json(
        {
          success: false,
          error: 'Erro ao verificar tabela subscriptions',
          details: tableError,
        },
        { status: 500 }
      )
    }

    if (!tableCheck || tableCheck.length === 0) {
      console.log('❌ Tabela subscriptions não existe')
      return NextResponse.json(
        {
          success: false,
          error: 'Tabela subscriptions não existe',
          message: 'Execute a migração para criar a tabela',
        },
        { status: 404 }
      )
    }

    console.log('✅ Tabela subscriptions existe')

    // 2. Verificar estrutura da tabela
    console.log('\n--- VERIFICANDO ESTRUTURA ---')
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_schema', 'public')
      .eq('table_name', 'subscriptions')
      .order('ordinal_position')

    if (columnsError) {
      console.error('❌ Erro ao verificar colunas:', columnsError)
      return NextResponse.json(
        {
          success: false,
          error: 'Erro ao verificar colunas da tabela',
          details: columnsError,
        },
        { status: 500 }
      )
    }

    console.log(
      '✅ Colunas da tabela:',
      columns?.map(col => `${col.column_name} (${col.data_type})`).join(', ')
    )

    // 3. Testar inserção simples
    console.log('\n--- TESTANDO INSERÇÃO SIMPLES ---')
    try {
      const testData = {
        user_id: '3f0e0184-c0a7-487e-b611-72890b39dcce',
        status: 'active',
        plan_type: 'monthly',
        price_id: 'test_price',
        subscription_id: `test_${Date.now()}`,
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        cancel_at_period_end: false,
        explicacao_pratica: false,
      }

      console.log('Dados de teste:', JSON.stringify(testData, null, 2))

      const { data: insertResult, error: insertError } = await supabase
        .from('subscriptions')
        .insert(testData)
        .select()
        .single()

      if (insertError) {
        console.error('❌ Erro na inserção:', insertError)
        return NextResponse.json(
          {
            success: false,
            error: 'Erro ao inserir dados na tabela subscriptions',
            details: insertError,
            testData: testData,
          },
          { status: 500 }
        )
      }

      console.log('✅ Inserção bem-sucedida:', insertResult.id)

      // 4. Verificar dados inseridos
      console.log('\n--- VERIFICANDO DADOS INSERIDOS ---')
      const { data: verifyResult, error: verifyError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('id', insertResult.id)
        .single()

      if (verifyError) {
        console.error('❌ Erro ao verificar dados:', verifyError)
      } else {
        console.log('✅ Dados verificados:', {
          id: verifyResult.id,
          status: verifyResult.status,
          current_period_start: verifyResult.current_period_start,
          current_period_end: verifyResult.current_period_end,
          explicacao_pratica: verifyResult.explicacao_pratica,
        })
      }

      // 5. Limpar dados de teste
      console.log('\n--- LIMPANDO DADOS DE TESTE ---')
      const { error: deleteError } = await supabase
        .from('subscriptions')
        .delete()
        .eq('id', insertResult.id)

      if (deleteError) {
        console.error('❌ Erro ao limpar dados de teste:', deleteError)
      } else {
        console.log('✅ Dados de teste removidos')
      }

      return NextResponse.json({
        success: true,
        message: 'Banco de dados está funcionando corretamente',
        data: {
          tableExists: true,
          columns: columns,
          insertTest: true,
          verifyTest: !verifyError,
          cleanupTest: !deleteError,
        },
      })
    } catch (testError) {
      console.error('❌ Erro no teste de inserção:', testError)
      return NextResponse.json(
        {
          success: false,
          error: 'Erro no teste de inserção',
          details: testError instanceof Error ? testError.message : 'Erro desconhecido',
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Erro geral na verificação do banco:', error)
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
