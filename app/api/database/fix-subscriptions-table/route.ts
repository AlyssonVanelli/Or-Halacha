import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'

export async function POST() {
  try {
    console.log('=== CORRIGINDO ESTRUTURA DA TABELA SUBSCRIPTIONS ===')

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

    const tableNeedsCreation = !tableExists || tableExists.length === 0

    if (tableNeedsCreation) {
      console.log('Criando tabela subscriptions...')

      // Executar SQL para criar a tabela
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS subscriptions (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
          status TEXT NOT NULL CHECK (status IN ('active', 'trialing', 'canceled', 'incomplete', 'incomplete_expired', 'past_due', 'unpaid')),
          plan_type TEXT NOT NULL CHECK (plan_type IN ('monthly', 'yearly')),
          price_id TEXT,
          subscription_id TEXT UNIQUE,
          current_period_start TIMESTAMP WITH TIME ZONE,
          current_period_end TIMESTAMP WITH TIME ZONE,
          cancel_at_period_end BOOLEAN DEFAULT FALSE,
          explicacao_pratica BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
        );
      `

      const { error: createError } = await supabase.rpc('exec_sql', { sql: createTableSQL })

      if (createError) {
        console.error('Erro ao criar tabela:', createError)
        return NextResponse.json(
          {
            success: false,
            error: 'Erro ao criar tabela subscriptions',
            details: createError,
          },
          { status: 500 }
        )
      }

      console.log('✅ Tabela subscriptions criada')

      // Criar índices
      const createIndexesSQL = `
        CREATE INDEX IF NOT EXISTS subscriptions_user_id_idx ON subscriptions (user_id);
        CREATE INDEX IF NOT EXISTS subscriptions_subscription_id_idx ON subscriptions (subscription_id);
        CREATE INDEX IF NOT EXISTS subscriptions_status_idx ON subscriptions (status);
      `

      const { error: indexError } = await supabase.rpc('exec_sql', { sql: createIndexesSQL })

      if (indexError) {
        console.error('Erro ao criar índices:', indexError)
        // Continuar mesmo com erro nos índices
      } else {
        console.log('✅ Índices criados')
      }

      // Habilitar RLS
      const enableRLSSQL = `ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;`
      const { error: rlsError } = await supabase.rpc('exec_sql', { sql: enableRLSSQL })

      if (rlsError) {
        console.error('Erro ao habilitar RLS:', rlsError)
        // Continuar mesmo com erro no RLS
      } else {
        console.log('✅ RLS habilitado')
      }

      // Criar políticas RLS
      const createPoliciesSQL = `
        CREATE POLICY "Users can view their own subscriptions" ON subscriptions
          FOR SELECT USING (auth.uid() = user_id);

        CREATE POLICY "Users can insert their own subscriptions" ON subscriptions
          FOR INSERT WITH CHECK (auth.uid() = user_id);

        CREATE POLICY "Users can update their own subscriptions" ON subscriptions
          FOR UPDATE USING (auth.uid() = user_id);
      `

      const { error: policyError } = await supabase.rpc('exec_sql', { sql: createPoliciesSQL })

      if (policyError) {
        console.error('Erro ao criar políticas:', policyError)
        // Continuar mesmo com erro nas políticas
      } else {
        console.log('✅ Políticas RLS criadas')
      }

      // Criar trigger para updated_at
      const createTriggerSQL = `
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = TIMEZONE('utc'::text, NOW());
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;

        CREATE TRIGGER update_subscriptions_updated_at
          BEFORE UPDATE ON subscriptions
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      `

      const { error: triggerError } = await supabase.rpc('exec_sql', { sql: createTriggerSQL })

      if (triggerError) {
        console.error('Erro ao criar trigger:', triggerError)
        // Continuar mesmo com erro no trigger
      } else {
        console.log('✅ Trigger criado')
      }
    } else {
      console.log('Tabela subscriptions já existe, verificando estrutura...')

      // Verificar se a coluna explicacao_pratica existe
      const { data: columns, error: columnsError } = await supabase
        .from('information_schema.columns')
        .select('column_name')
        .eq('table_schema', 'public')
        .eq('table_name', 'subscriptions')
        .eq('column_name', 'explicacao_pratica')

      if (columnsError) {
        console.error('Erro ao verificar colunas:', columnsError)
      } else if (!columns || columns.length === 0) {
        console.log('Adicionando coluna explicacao_pratica...')

        const addColumnSQL = `
          ALTER TABLE subscriptions 
          ADD COLUMN IF NOT EXISTS explicacao_pratica BOOLEAN DEFAULT FALSE;
        `

        const { error: addColumnError } = await supabase.rpc('exec_sql', { sql: addColumnSQL })

        if (addColumnError) {
          console.error('Erro ao adicionar coluna:', addColumnError)
        } else {
          console.log('✅ Coluna explicacao_pratica adicionada')
        }
      } else {
        console.log('✅ Coluna explicacao_pratica já existe')
      }
    }

    // Verificar estrutura final
    const { data: finalColumns, error: finalError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_schema', 'public')
      .eq('table_name', 'subscriptions')
      .order('ordinal_position')

    if (finalError) {
      console.error('Erro ao verificar estrutura final:', finalError)
    } else {
      console.log('✅ Estrutura final da tabela:', finalColumns)
    }

    return NextResponse.json({
      success: true,
      message: 'Estrutura da tabela subscriptions corrigida',
      data: {
        tableCreated: tableNeedsCreation,
        columns: finalColumns,
        summary: {
          totalColumns: finalColumns?.length || 0,
          hasExplicacaoPratica:
            finalColumns?.some(col => col.column_name === 'explicacao_pratica') || false,
        },
      },
    })
  } catch (error) {
    console.error('Erro geral na correção:', error)
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
