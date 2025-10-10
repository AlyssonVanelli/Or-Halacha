const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

// Debug do caminho do .env
const envPath = path.resolve(process.cwd(), '.env.local')
console.log('🔍 Procurando arquivo .env em:', envPath)
console.log('📁 Arquivo .env existe?', fs.existsSync(envPath))

// Tentar carregar o .env com caminho explícito
require('dotenv').config({ path: envPath })

// Configure suas variáveis de ambiente
const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

// Debug das variáveis de ambiente
console.log('🔍 Debug das variáveis de ambiente:')
console.log('SUPABASE_URL existe?', !!SUPABASE_URL)
console.log('SUPABASE_SERVICE_ROLE_KEY existe?', !!SUPABASE_SERVICE_ROLE_KEY)

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Erro: Variáveis de ambiente não encontradas!')
  console.error('Verifique se o arquivo .env existe e contém:')
  console.error('SUPABASE_URL=sua_url_do_supabase')
  console.error('SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role')
  process.exit(1)
}

// Verificar formato da URL
if (!SUPABASE_URL.startsWith('https://') || !SUPABASE_URL.includes('.supabase.co')) {
  console.error('❌ Erro: URL do Supabase inválida!')
  console.error('URL atual:', SUPABASE_URL)
  console.error('A URL deve começar com https:// e terminar com .supabase.co')
  process.exit(1)
}

console.log('🔧 Configurando cliente Supabase...')
console.log('📡 URL:', SUPABASE_URL)
console.log('🔑 Service Role Key:', SUPABASE_SERVICE_ROLE_KEY.substring(0, 10) + '...')

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// Teste de conexão
async function testConnection() {
  try {
    console.log('🔄 Testando conexão com o Supabase...')
    const { data, error } = await supabase.from('books').select('count').limit(1)

    if (error) {
      console.error('❌ Erro ao conectar com o Supabase:', error)
      process.exit(1)
    }

    console.log('✅ Conexão com o Supabase estabelecida com sucesso!')
  } catch (error) {
    console.error('❌ Erro ao testar conexão:', error)
    process.exit(1)
  }
}

const BASE_DIR = path.join(__dirname, 'Sulchan Aruch')
console.log('📁 Diretório base:', BASE_DIR)

// Mapeamento das divisões principais
const DIVISOES = [
  {
    pasta: '1 Orach Chayim',
    slug: 'orach-chayim',
    titulo: 'Orach Chayim',
    pos: 1,
    desc: 'Leis do cotidiano e oração',
  },
  {
    pasta: "2 Yoreh De'ah",
    slug: 'yoreh-deah',
    titulo: "Yoreh De'ah",
    pos: 2,
    desc: 'Leis de kashrut, pureza, etc.',
  },
  {
    pasta: '3 Even HaEzer',
    slug: 'even-haezer',
    titulo: 'Even HaEzer',
    pos: 3,
    desc: 'Leis de casamento e divórcio',
  },
  {
    pasta: '6 Choshen Mishpat',
    slug: 'choshen-mishpat',
    titulo: 'Choshen Mishpat',
    pos: 4,
    desc: 'Leis civis e monetárias',
  },
]

// Apêndices do Even HaEzer
const APPENDICES = [
  { pasta: '4 Seder HaGet', appendix_type: 'Seder HaGet' },
  { pasta: '5 Seder Halitzah', appendix_type: 'Seder Halitzah' },
]

function uuid() {
  // Gera um UUID v4 simples (não para produção crítica)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

async function main() {
  console.log('🚀 Iniciando processo de importação...')

  try {
    // Testar conexão antes de começar
    await testConnection()

    // Busca o livro pelo slug
    const { data: existingBook, error: fetchError } = await supabase
      .from('books')
      .select('id')
      .eq('slug', 'shulchan-aruch')
      .single()

    let bookId
    if (existingBook) {
      bookId = existingBook.id
      console.log('📚 Livro principal já existe, usando o mesmo id:', bookId)
    } else {
      bookId = uuid()
      console.log('📚 Livro principal não existe, criando novo id:', bookId)
    }

    const { error: bookError } = await supabase.from('books').upsert(
      [
        {
          id: bookId,
          title: 'Shulchan Aruch',
          slug: 'shulchan-aruch',
          description: 'O Shulchan Aruch completo em português, com explicações práticas.',
          author: 'R. Yosef Karo',
          is_published: true,
          type: 'shulchan_aruch',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ],
      { onConflict: ['slug'] }
    )

    if (bookError) {
      console.error('❌ Erro ao inserir livro principal:', bookError)
      return
    }
    console.log('✅ Livro principal inserido/atualizado com sucesso')

    // Importar todas as divisões
    for (const div of DIVISOES) {
      console.log(`\n📝 Processando divisão: ${div.titulo}`)
      // Buscar divisão existente pelo book_id e slug
      const { data: existingDivision } = await supabase
        .from('divisions')
        .select('id')
        .eq('book_id', bookId)
        .eq('slug', div.slug)
        .single()

      const divId = existingDivision ? existingDivision.id : uuid()
      const divPath = path.join(BASE_DIR, div.pasta)

      if (!fs.existsSync(divPath)) {
        console.log(`⚠️ Diretório não encontrado: ${divPath}`)
        continue
      }

      await supabase.from('divisions').upsert(
        [
          {
            id: divId,
            book_id: bookId,
            title: div.titulo,
            slug: div.slug,
            position: div.pos,
            description: div.desc,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ],
        { onConflict: ['book_id', 'slug'] }
      )

      console.log(`✅ Divisão ${div.titulo} inserida/atualizada com sucesso`)

      // Simanim
      const files = fs.readdirSync(divPath).filter(f => f.endsWith('.txt'))

      // Log detalhado dos arquivos encontrados
      const simanNums = files.map(f => parseInt(f.match(/siman_(\d+)\.txt/)[1], 10))
      console.log(`📄 Arquivos filtrados:`, files)
      console.log(`🔢 Números dos simanim encontrados:`, simanNums)
      if (simanNums.length > 0) {
        console.log(`🔎 Range: siman ${Math.min(...simanNums)} até ${Math.max(...simanNums)}`)
      } else {
        console.log('⚠️ Nenhum siman encontrado!')
      }

      console.log(`📄 Encontrados ${files.length} arquivos em ${div.titulo}`)

      for (const file of files) {
        console.log(`\n📝 Processando arquivo: ${file}`)
        await importSiman({
          file,
          divId,
          divSlug: div.slug,
          appendix_type: null,
          bookId,
          dirPath: divPath,
        })
      }
    }

    console.log('\n✨ Importação concluída com sucesso!')
  } catch (error) {
    console.error('❌ Erro durante a importação:', error)
    process.exit(1)
  }
}

async function importSiman({ file, divId, divSlug, appendix_type, bookId, dirPath }) {
  try {
    const simanNum = file.match(/siman_(\d+)/i)?.[1] || file
    const slug =
      `siman-${simanNum}` +
      (appendix_type ? `-${appendix_type.toLowerCase().replace(/\s/g, '-')}` : '')
    const simanTitle = `Siman ${simanNum}` + (appendix_type ? ` (${appendix_type})` : '')
    const filePath = path.join(dirPath, file)

    console.log(`📖 Lendo arquivo: ${filePath}`)
    const content = fs.readFileSync(filePath, 'utf8')

    // Separar seifim e explicação prática
    const [mainText, explicacao] = content.split('--- EXPLICAÇÃO PRÁTICA ---')
    const seifMatches = [...mainText.matchAll(/\n(\d+)\. /g)]
    let seifims = []

    if (seifMatches.length > 0) {
      console.log(`📑 Encontrados ${seifMatches.length} seifim`)
      for (let i = 0; i < seifMatches.length; i++) {
        const start = seifMatches[i].index + 1
        const end = seifMatches[i + 1]?.index || mainText.length
        const number = parseInt(seifMatches[i][1])
        const text = mainText.slice(start, end).trim()
        seifims.push({ number, text })
      }
    } else {
      console.log('📑 Nenhum seif encontrado, usando texto completo')
      seifims = [{ number: 1, text: mainText.trim() }]
    }

    // Explicações práticas
    let explicacoes = []
    if (explicacao) {
      console.log('📝 Processando explicações práticas')
      const expSeifMatches = [...explicacao.matchAll(/\n\d+\. /g)]
      if (expSeifMatches.length > 0) {
        for (let i = 0; i < expSeifMatches.length; i++) {
          const start = expSeifMatches[i].index + 1
          const end = expSeifMatches[i + 1]?.index || explicacao.length
          const number = parseInt(expSeifMatches[i][0])
          const text = explicacao.slice(start, end).trim()
          explicacoes.push({ number, text })
        }
      } else {
        explicacoes = [{ number: 1, text: explicacao.trim() }]
      }
    }

    // Buscar capítulo existente pelo book_id, division_id e slug
    const { data: existingChapter } = await supabase
      .from('chapters')
      .select('id')
      .eq('book_id', bookId)
      .eq('division_id', divId)
      .eq('slug', slug)
      .single()

    const chapterId = existingChapter ? existingChapter.id : uuid()

    // Inserir capítulo (siman)
    console.log(`📝 Inserindo capítulo: ${simanTitle}`)
    const { error: chapterError } = await supabase.from('chapters').upsert(
      [
        {
          id: chapterId,
          book_id: bookId,
          division_id: divId,
          title: simanTitle,
          slug,
          position: parseInt(simanNum),
          is_published: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          appendix_type,
        },
      ],
      { onConflict: ['book_id', 'division_id', 'slug'] }
    )

    if (chapterError) {
      console.error(`❌ Erro ao inserir capítulo ${simanTitle}:`, chapterError)
      return
    }

    // Após inserir o capítulo (siman)
    const { error: contentError, data: contentData } = await supabase.from('content').upsert(
      [
        {
          chapter_id: chapterId,
          content: mainText.trim(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ],
      { onConflict: ['chapter_id'] }
    )

    if (contentError) {
      console.error(`❌ Erro ao inserir conteúdo do capítulo ${simanTitle}:`, contentError)
    } else {
      console.log(`✅ Conteúdo inserido para capítulo ${simanTitle}`, contentData)
    }

    // Inserir seifim
    console.log(`📝 Inserindo ${seifims.length} seifim`)
    for (const seif of seifims) {
      const sectionId = uuid()
      const exp = explicacoes.find(e => e.number === seif.number)?.text || null
      const { error: sectionError } = await supabase.from('sections').upsert(
        [
          {
            id: sectionId,
            chapter_id: chapterId,
            number: seif.number,
            title: null,
            content: seif.text,
            practical_explanation: exp,
            position: seif.number,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ],
        { onConflict: ['chapter_id', 'number'] }
      )

      if (sectionError) {
        console.error(`❌ Erro ao inserir seif ${seif.number}:`, sectionError)
        continue
      }
    }
    console.log(`✅ Siman ${simanNum} processado com sucesso`)
  } catch (error) {
    console.error(`❌ Erro ao processar siman ${file}:`, error)
  }
}

main().catch(err => {
  console.error('❌ Erro fatal na importação:', err)
  process.exit(1)
})
