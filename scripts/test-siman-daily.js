#!/usr/bin/env node

/**
 * Script para testar o sorteio do siman diário
 * Uso: node scripts/test-siman-daily.js
 */

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não configuradas')
  console.error('Necessário: NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testSimanDaily() {
  console.log('🔄 Testando sorteio do siman diário...')

  try {
    // Verificar se já existe siman para hoje
    const hoje = new Date().toISOString().slice(0, 10)
    console.log(`📅 Data de hoje: ${hoje}`)

    const { data: existingSiman, error: checkError } = await supabase
      .from('siman_do_dia')
      .select('*')
      .eq('data', hoje)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ Erro ao verificar siman existente:', checkError)
      return
    }

    if (existingSiman) {
      console.log('✅ Já existe siman para hoje:')
      console.log(`   📖 Livro: ${existingSiman.livro}`)
      console.log(`   📚 Tratado: ${existingSiman.tratado}`)
      console.log(`   🔢 Número: ${existingSiman.numero}`)
      console.log(`   📝 Título: ${existingSiman.titulo}`)
      return
    }

    console.log('🎲 Executando sorteio...')

    // Executar a função de sorteio
    const { data, error } = await supabase.rpc('sortear_siman_do_dia')

    if (error) {
      console.error('❌ Erro ao executar sorteio:', error)
      return
    }

    console.log('✅ Sorteio executado com sucesso!')

    // Verificar o resultado
    const { data: newSiman, error: fetchError } = await supabase
      .from('siman_do_dia')
      .select('*')
      .eq('data', hoje)
      .single()

    if (fetchError) {
      console.error('❌ Erro ao buscar siman sorteado:', fetchError)
      return
    }

    console.log('🎉 Siman do dia sorteado:')
    console.log(`   📖 Livro: ${newSiman.livro}`)
    console.log(`   📚 Tratado: ${newSiman.tratado}`)
    console.log(`   🔢 Número: ${newSiman.numero}`)
    console.log(`   📝 Título: ${newSiman.titulo}`)
    console.log(`   📄 Seif: ${newSiman.seif?.substring(0, 100)}...`)
  } catch (error) {
    console.error('💥 Erro inesperado:', error)
  }
}

// Executar o teste
testSimanDaily()
