'use client'
// /components/FaqAccordion.tsx
import { useState } from 'react'

type FaqItem = {
  question: string
  answer: string
}

const FAQS: FaqItem[] = [
  {
    question: 'O que é o Or Halacha?',
    answer:
      'Or Halacha é uma plataforma em Português com ensinamentos e decisões de Halachá, baseada nos quatro tratados do Shulchan Aruch, para facilitar seu estudo e consulta.',
  },
  {
    question: 'Como funciona a minha dashboard?',
    answer:
      'Após o login, você acessa o dashboard onde pode filtrar e navegar pelos quatro tratados do Shulchan Aruch, salvando favoritos para consulta rápida.',
  },
  {
    question: 'Posso sugerir novos conteúdos?',
    answer:
      'Sim! Na seção de Suporte (menu "Suporte") você pode enviar sugestões de temas ou comentários sobre o conteúdo.',
  },
  {
    question: 'Como atualizo meu e-mail ou senha?',
    answer:
      'Vá em Configurações (ícone de perfil no dashboard) e escolha "Editar Perfil". Lá você consegue alterar seu e-mail ou senha.',
  },
]

export default function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  function toggle(i: number) {
    setOpenIndex(openIndex === i ? null : i)
  }

  return (
    <section
      id="faq"
      style={{
        marginTop: '2rem',
        marginBottom: '2rem',
        textAlign: 'left',
      }}
    >
      <h2>Perguntas Frequentes</h2>
      <div>
        {FAQS.map((item, i) => (
          <div key={i} style={{ borderBottom: '1px solid #ccc', padding: '1rem 0' }}>
            <button
              onClick={() => toggle(i)}
              style={{
                background: 'none',
                border: 'none',
                width: '100%',
                textAlign: 'left',
                fontSize: '1.1rem',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              {item.question}
            </button>
            {openIndex === i && (
              <p style={{ marginTop: '0.5rem', lineHeight: 1.6 }}>{item.answer}</p>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
