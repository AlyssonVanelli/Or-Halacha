function getWeekRange(date: string) {
  // Para buscar a semana inteira (domingo a sábado)
  // Se for 2025-10-20 (segunda), a semana vai de 2025-10-19 (domingo) a 2025-10-25 (sábado)
  const inputDate = new Date(date)
  const dayOfWeek = inputDate.getDay() // 0 = domingo, 6 = sábado

  // Calcular domingo da semana
  const sunday = new Date(inputDate)
  sunday.setDate(inputDate.getDate() - dayOfWeek)

  // Calcular sábado da semana
  const saturday = new Date(sunday)
  saturday.setDate(sunday.getDate() + 6)

  return {
    start: sunday.toISOString().split('T')[0],
    end: saturday.toISOString().split('T')[0],
  }
}

function translateBookName(bookName: string): string {
  const bookMap: { [key: string]: string } = {
    Genesis: 'Gênesis',
    Exodus: 'Êxodo',
    Leviticus: 'Levítico',
    Numbers: 'Números',
    Deuteronomy: 'Deuteronômio',
    Joshua: 'Josué',
    Judges: 'Juízes',
    Samuel: 'Samuel',
    Kings: 'Reis',
    Isaiah: 'Isaías',
    Jeremiah: 'Jeremias',
    Ezekiel: 'Ezequiel',
    Hosea: 'Oséias',
    Joel: 'Joel',
    Amos: 'Amós',
    Obadiah: 'Obadias',
    Jonah: 'Jonas',
    Micah: 'Miquéias',
    Nahum: 'Naum',
    Habakkuk: 'Habacuque',
    Zephaniah: 'Sofonias',
    Haggai: 'Ageu',
    Zechariah: 'Zacarias',
    Malachi: 'Malaquias',
    Psalms: 'Salmos',
    Proverbs: 'Provérbios',
    Job: 'Jó',
    'Song of Songs': 'Cantares',
    Ruth: 'Rute',
    Lamentations: 'Lamentações',
    Ecclesiastes: 'Eclesiastes',
    Esther: 'Ester',
    Daniel: 'Daniel',
    Ezra: 'Esdras',
    Nehemiah: 'Neemias',
    Chronicles: 'Crônicas',
  }

  return bookMap[bookName] || bookName
}

function translateHolidayName(holidayName: string): string {
  const holidayMap: { [key: string]: string } = {
    'Pesach I': 'Pessach I',
    'Pesach II': 'Pessach II',
    'Pesach Chol ha-Moed Day 1': 'Pessach Chol ha-Moed Dia 1',
    'Pesach Chol ha-Moed Day 2': 'Pessach Chol ha-Moed Dia 2',
    'Pesach Chol ha-Moed Day 3': 'Pessach Chol ha-Moed Dia 3',
    'Pesach Chol ha-Moed Day 4': 'Pessach Chol ha-Moed Dia 4',
    'Pesach VII (on Shabbat)': 'Pessach VII (no Shabbat)',
    'Sukkot I': 'Sucot I',
    'Sukkot II': 'Sucot II',
    'Sukkot Chol ha-Moed Day 1': 'Sucot Chol ha-Moed Dia 1',
    'Sukkot Chol ha-Moed Day 2': 'Sucot Chol ha-Moed Dia 2',
    'Sukkot Shabbat Chol ha-Moed': 'Sucot Shabbat Chol ha-Moed',
    'Rosh Hashana': 'Rosh Hashaná',
    'Yom Kippur': 'Yom Kipur',
    Shavuot: 'Shavuot',
    Chanukah: 'Chanucá',
    Purim: 'Purim',
    "Tisha B'Av": "Tisha B'Av",
    'Tu Bishvat': 'Tu Bishvat',
    'Lag BaOmer': 'Lag BaOmer',
    'Simchat Torah': 'Simchat Torá',
    'Shmini Atzeret': 'Shmini Atzeret',
  }
  return holidayMap[holidayName] || holidayName
}

function getParashaNameFromReading(summary: string): string {
  // Mapear leituras específicas para nomes de parashot
  const parashaMap: { [key: string]: string } = {
    'Exodus 13:17-15:26': 'Beshalach', // Mar Vermelho
    'Exodus 12:21-51': 'Bo', // Saída do Egito
    'Leviticus 22:26-23:44': 'Emor', // Festivais
    'Numbers 9:1-14': 'Behaalotecha', // Pessach Sheni
    'Exodus 34:1-26': 'Ki Tisa', // Segundas Tábuas
    'Exodus 22:24-23:19': 'Mishpatim', // Leis
    'Exodus 13:1-16': 'Bo', // Consagração dos primogênitos
    'Numbers 28:16-25': 'Pessach', // Ofertas de Pessach
    'Numbers 28:19-25': 'Pessach', // Ofertas de Chol ha-Moed
    'Numbers 29:12-16': 'Sucot', // Ofertas de Sucot
    'Numbers 29:17-25': 'Sucot', // Ofertas de Chol ha-Moed Sucot
    'Numbers 29:20-28': 'Sucot', // Ofertas de Chol ha-Moed Sucot
    'Numbers 29:23-28': 'Sucot', // Ofertas de Chol ha-Moed Sucot
    'Exodus 33:12-34:26': 'Ki Tisa', // Revelação
    'Song of Songs 1:1-8:14': 'Shir ha-Shirim', // Cantares
  }

  // Buscar por correspondência exata ou parcial
  for (const [reading, parasha] of Object.entries(parashaMap)) {
    if (summary.includes(reading)) {
      return parasha
    }
  }

  return 'Parashá Especial'
}

export async function getParashaSemanal() {
  try {
    // Buscar a semana inteira (domingo a sábado) baseada na data atual
    const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD
    const weekRange = getWeekRange(today)

    // URL do Hebcal com parâmetros otimizados para Vercel
    const url = `https://www.hebcal.com/leyning?cfg=json&start=${weekRange.start}&end=${weekRange.end}&geonameid=3469058`

    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Or-Halacha/1.0)',
        Accept: 'application/json',
        'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
        'Cache-Control': 'no-cache',
      },
      // Timeout para Vercel
      signal: AbortSignal.timeout(10000), // 10 segundos
    })

    if (!res.ok) {
      return {
        nome: 'Parashá da Semana\nDomingo: Leitura de Teste 1\nSegunda: Leitura de Teste 2\nTerça: Leitura de Teste 3\nQuarta: Leitura de Teste 4\nQuinta: Leitura de Teste 5\nSexta: Leitura de Teste 6',
        haftarah: 'Leitura de Teste da Haftará',
        leituraEspecial: 'Feriado de Teste',
        parashaName: 'Parashá de Teste',
      }
    }

    const data = await res.json()
    const items = data.items || []

    let nome = 'Parashá da Semana'
    let parashaName = ''
    let haftarah = 'Haftará não disponível'
    let leituraEspecial = ''

    // Criar array para todos os dias da semana (domingo a sexta)
    const weekDays = [
      'domingo',
      'segunda-feira',
      'terça-feira',
      'quarta-feira',
      'quinta-feira',
      'sexta-feira',
    ]
    const dailyReadings: string[] = []

    // Buscar o Shabbat para pegar as 7 aliyot e haftará
    let parashaAliyot: string[] = []

    // Sempre processar o sábado (seja Shabbat normal ou feriado)
    const saturdayItem = items.find(item => {
      const itemDate = new Date(item.date)
      return itemDate.getDay() === 6 // Sábado
    })

    if (saturdayItem) {
      // Determinar o nome da parashá baseado na leitura do Shabbat
      if (saturdayItem.type === 'holiday' && saturdayItem.summary) {
        parashaName = getParashaNameFromReading(saturdayItem.summary)
      } else {
        parashaName = saturdayItem.name?.en || ''
      }

      // Traduzir a haftará
      const haftarahText = saturdayItem.haftara || 'Haftará não disponível'
      if (haftarahText !== 'Haftará não disponível') {
        // Traduzir os nomes dos livros na haftará
        haftarah = haftarahText.replace(
          /\b(Genesis|Exodus|Leviticus|Numbers|Deuteronomy|Joshua|Judges|Samuel|Kings|Isaiah|Jeremiah|Ezekiel|Hosea|Joel|Amos|Obadiah|Jonah|Micah|Nahum|Habakkuk|Zephaniah|Haggai|Zechariah|Malachi|Psalms|Proverbs|Job|Song of Songs|Ruth|Lamentations|Ecclesiastes|Esther|Daniel|Ezra|Nehemiah|Chronicles)\b/g,
          match => translateBookName(match)
        )
      } else {
        haftarah = haftarahText
      }

      // Só extrair aliyot se for um Shabbat normal (não feriado)
      if (saturdayItem.type === 'shabbat') {
        for (const [aliyaNum, aliyaData] of Object.entries(saturdayItem.fullkriyah)) {
          if (aliyaData && typeof aliyaData === 'object' && 'k' in aliyaData && aliyaNum !== 'M') {
            const aliya = aliyaData as { k: string; b: string; e: string }
            const bookName = translateBookName(aliya.k)
            parashaAliyot.push(`${bookName} ${aliya.b}-${aliya.e}`)
          }
        }
      }
    }

    // Processar cada dia da semana
    for (let i = 0; i < 6; i++) {
      const currentDate = new Date(weekRange.start) // Domingo da semana
      currentDate.setDate(currentDate.getDate() + i)
      const dayName = weekDays[i]
      const dayDate = currentDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
      const dateStr = currentDate.toISOString().split('T')[0]

      // Buscar item correspondente a este dia
      const item = items.find(item => item.date === dateStr)

      if (item) {
        if (item.type === 'holiday') {
          // Feriados - leitura completa (em casa lê tudo de uma vez)
          if (item.summary) {
            // Traduzir os nomes dos livros no summary
            const translatedSummary = item.summary.replace(
              /\b(Genesis|Exodus|Leviticus|Numbers|Deuteronomy|Joshua|Judges|Samuel|Kings|Isaiah|Jeremiah|Ezekiel|Hosea|Joel|Amos|Obadiah|Jonah|Micah|Nahum|Habakkuk|Zephaniah|Haggai|Zechariah|Malachi|Psalms|Proverbs|Job|Song of Songs|Ruth|Lamentations|Ecclesiastes|Esther|Daniel|Ezra|Nehemiah|Chronicles)\b/g,
              match => translateBookName(match)
            )
            const translatedHolidayName = translateHolidayName(item.name.en)
            dailyReadings.push(
              `${dayName} (${dayDate}) - ${translatedHolidayName}: ${translatedSummary}`
            )
          } else {
            const translatedHolidayName = translateHolidayName(item.name.en)
            dailyReadings.push(`${dayName} (${dayDate}) - ${translatedHolidayName}`)
          }
        } else if (item.type === 'weekday') {
          // Dias da semana - priorizar summary se existir
          if (item.summary) {
            // Se tem summary, mostrar a leitura completa (como Vezot Haberakhah)
            const translatedSummary = item.summary.replace(
              /\b(Genesis|Exodus|Leviticus|Numbers|Deuteronomy|Joshua|Judges|Samuel|Kings|Isaiah|Jeremiah|Ezekiel|Hosea|Joel|Amos|Obadiah|Jonah|Micah|Nahum|Habakkuk|Zephaniah|Haggai|Zechariah|Malachi|Psalms|Proverbs|Job|Song of Songs|Ruth|Lamentations|Ecclesiastes|Esther|Daniel|Ezra|Nehemiah|Chronicles)\b/g,
              match => translateBookName(match)
            )
            dailyReadings.push(`${dayName} (${dayDate}): ${translatedSummary}`)
          } else if (item.weekday && parashaAliyot[i]) {
            // Dias da semana com leitura pública (segunda e quinta) - mostrar aliyá correspondente da parashá
            dailyReadings.push(`${dayName} (${dayDate}): ${i + 1}ª Aliyá - ${parashaAliyot[i]}`)
          } else {
            dailyReadings.push(`${dayName} (${dayDate}): ${item.name.en}`)
          }
        } else if (parashaAliyot[i]) {
          // Aliyá da parashá para este dia
          dailyReadings.push(`${dayName} (${dayDate}): ${i + 1}ª Aliyá - ${parashaAliyot[i]}`)
        } else {
          // Dia sem leitura específica
          dailyReadings.push(`${dayName} (${dayDate}): Sem leitura`)
        }
      } else if (parashaAliyot[i]) {
        // Aliyá da parashá para este dia
        dailyReadings.push(`${dayName} (${dayDate}): ${i + 1}ª Aliyá - ${parashaAliyot[i]}`)
      } else {
        // Dia sem leitura específica
        dailyReadings.push(`${dayName} (${dayDate}): Sem leitura`)
      }
    }

    // Adicionar Shabbat separadamente
    if (saturdayItem) {
      const shabbatDate = new Date(saturdayItem.date).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
      })

      if (saturdayItem.type === 'holiday' && saturdayItem.summary) {
        // Shabbat de feriado - mostrar leitura específica
        const translatedSummary = saturdayItem.summary.replace(
          /\b(Genesis|Exodus|Leviticus|Numbers|Deuteronomy|Joshua|Judges|Samuel|Kings|Isaiah|Jeremiah|Ezekiel|Hosea|Joel|Amos|Obadiah|Jonah|Micah|Nahum|Habakkuk|Zephaniah|Haggai|Zechariah|Malachi|Psalms|Proverbs|Job|Song of Songs|Ruth|Lamentations|Ecclesiastes|Esther|Daniel|Ezra|Nehemiah|Chronicles)\b/g,
          match => translateBookName(match)
        )
        const translatedHolidayName = translateHolidayName(saturdayItem.name.en)
        dailyReadings.push(
          `sábado (${shabbatDate}) - ${translatedHolidayName}: ${translatedSummary}`
        )
      } else {
        // Shabbat normal - parashá completa
        dailyReadings.push(`sábado (${shabbatDate}) - ${saturdayItem.name.en}: Parashá completa`)
      }
    }

    nome = dailyReadings.join('\n')

    // Processar feriados especiais
    const specialHolidays = items.filter(
      item =>
        item.type === 'holiday' &&
        (item.name.en.includes('Rosh Chodesh') ||
          item.name.en.includes('Pesach') ||
          item.name.en.includes('Sukkot') ||
          item.name.en.includes('Chanukah') ||
          item.name.en.includes('Rosh Hashana') ||
          item.name.en.includes('Yom Kippur') ||
          item.name.en.includes('Shavuot') ||
          item.name.en.includes('Purim') ||
          item.name.en.includes('Tisha') ||
          item.name.en.includes('Tu Bishvat') ||
          item.name.en.includes('Lag BaOmer') ||
          item.name.en.includes('Simchat Torah') ||
          item.name.en.includes('Shmini Atzeret'))
    )

    // Processar Shabbatot especiais
    const specialShabbatot = items.filter(
      item =>
        item.type === 'shabbat' &&
        (item.name.en.includes('Shabbat Chol ha-Moed') ||
          item.name.en.includes('Shabbat HaGadol') ||
          item.name.en.includes('Shabbat Shuva') ||
          item.name.en.includes('Shabbat Nachamu') ||
          item.name.en.includes('Shabbat Chazon') ||
          item.name.en.includes('Shabbat Shekalim') ||
          item.name.en.includes('Shabbat Zachor') ||
          item.name.en.includes('Shabbat Parah') ||
          item.name.en.includes('Shabbat HaChodesh'))
    )

    if (specialHolidays.length > 0) {
      // Se há múltiplos feriados, mostrar o principal
      const mainHoliday = specialHolidays[0]
      leituraEspecial = mainHoliday.name.en
    } else if (specialShabbatot.length > 0) {
      // Se há Shabbatot especiais, mostrar o principal
      const mainShabbat = specialShabbatot[0]
      leituraEspecial = mainShabbat.name.en
    }

    const result = {
      nome,
      haftarah,
      leituraEspecial,
      parashaName,
    }

    return result
  } catch (error) {
    return {
      nome: 'Parashá da Semana\nDomingo: Leitura de Teste 1\nSegunda: Leitura de Teste 2\nTerça: Leitura de Teste 3\nQuarta: Leitura de Teste 4\nQuinta: Leitura de Teste 5\nSexta: Leitura de Teste 6',
      haftarah: 'Leitura de Teste da Haftará',
      leituraEspecial: 'Feriado de Teste',
      parashaName: 'Parashá de Teste',
    }
  }
}
