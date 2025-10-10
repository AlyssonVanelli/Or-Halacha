'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MessageCircle, Send, X, Bot, User } from 'lucide-react'

interface Message {
  id: string
  text: string
  isBot: boolean
  timestamp: Date
}

const FAQ_RESPONSES = {
  preço:
    'Nossos planos começam em R$ 29,90/mês para acesso completo aos tratados do Shulchan Aruch. Temos também planos anuais com desconto!',
  custa:
    'Nossos planos começam em R$ 29,90/mês para acesso completo aos tratados do Shulchan Aruch. Temos também planos anuais com desconto!',
  valor:
    'Nossos planos começam em R$ 29,90/mês para acesso completo aos tratados do Shulchan Aruch. Temos também planos anuais com desconto!',
  plano:
    'Nossos planos começam em R$ 29,90/mês para acesso completo aos tratados do Shulchan Aruch. Temos também planos anuais com desconto!',
  assinatura:
    'Você pode assinar através da nossa página de planos. Aceitamos cartão de crédito e PIX. O acesso é imediato após a confirmação do pagamento.',
  assinar:
    'Você pode assinar através da nossa página de planos. Aceitamos cartão de crédito e PIX. O acesso é imediato após a confirmação do pagamento.',
  livros:
    'Temos todos os tratados do Shulchan Aruch disponíveis: Orach Chayim, Yoreh Deah, Even HaEzer e Choshen Mishpat.',
  tratados:
    'Temos todos os tratados do Shulchan Aruch disponíveis: Orach Chayim, Yoreh Deah, Even HaEzer e Choshen Mishpat.',
  acesso:
    'Após a assinatura, você terá acesso completo a todos os tratados, busca avançada, favoritos e muito mais.',
  cancelamento:
    'Você pode cancelar sua assinatura a qualquer momento através do seu perfil. Não há taxas de cancelamento.',
  cancelar:
    'Você pode cancelar sua assinatura a qualquer momento através do seu perfil. Não há taxas de cancelamento.',
  suporte:
    'Para suporte técnico, entre em contato conosco pelo WhatsApp. Nossa equipe responde em até 24h.',
  trial: 'Oferecemos 7 dias grátis para você testar nossa plataforma antes de assinar.',
  grátis: 'Oferecemos 7 dias grátis para você testar nossa plataforma antes de assinar.',
  mobile:
    'Sim! Nossa plataforma é totalmente responsiva e funciona perfeitamente em celulares e tablets.',
  celular:
    'Sim! Nossa plataforma é totalmente responsiva e funciona perfeitamente em celulares e tablets.',
  offline: 'Atualmente não temos modo offline, mas estamos trabalhando nessa funcionalidade.',
  grupo:
    'Não oferecemos planos para grupos ainda, mas entre em contato conosco para discutir essa possibilidade.',
}

const DEFAULT_RESPONSES = [
  'Desculpe, não entendi sua pergunta. Pode reformular?',
  'Não tenho essa informação. Entre em contato com nosso suporte.',
  'Essa é uma pergunta interessante! Nossa equipe pode ajudar melhor.',
]

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Olá! Sou o assistente virtual da Or Halachá. Como posso ajudar você hoje?',
      isBot: true,
      timestamp: new Date(),
    },
  ])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const findBestResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase()

    // Procura por palavras-chave nas respostas FAQ
    for (const [keyword, response] of Object.entries(FAQ_RESPONSES)) {
      if (lowerMessage.includes(keyword)) {
        return response
      }
    }

    // Respostas específicas para perguntas comuns
    if (
      lowerMessage.includes('oi') ||
      lowerMessage.includes('olá') ||
      lowerMessage.includes('bom dia') ||
      lowerMessage.includes('boa tarde') ||
      lowerMessage.includes('boa noite')
    ) {
      return 'Olá! Como posso ajudar você hoje?'
    }

    if (
      lowerMessage.includes('obrigado') ||
      lowerMessage.includes('obrigada') ||
      lowerMessage.includes('valeu')
    ) {
      return 'De nada! Estou aqui para ajudar. Precisa de mais alguma coisa?'
    }

    if (
      lowerMessage.includes('tchau') ||
      lowerMessage.includes('até logo') ||
      lowerMessage.includes('até mais')
    ) {
      return 'Até logo! Qualquer dúvida, estou aqui!'
    }

    // Se não encontrou resposta específica, retorna uma resposta padrão
    return DEFAULT_RESPONSES[Math.floor(Math.random() * DEFAULT_RESPONSES.length)]
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      isBot: false,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsTyping(true)

    // Simula delay de digitação
    setTimeout(
      () => {
        const botResponse = findBestResponse(inputValue)

        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: botResponse,
          isBot: true,
          timestamp: new Date(),
        }

        setMessages(prev => [...prev, botMessage])
        setIsTyping(false)
      },
      1000 + Math.random() * 1000
    )
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage()
    }
  }

  const openWhatsApp = () => {
    const message = encodeURIComponent('Olá! Preciso de ajuda com a Or Halachá.')
    window.open(`https://wa.me/972555196370?text=${message}`, '_blank')
  }

  return (
    <>
      {/* Botão flutuante */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-blue-600 shadow-lg hover:bg-blue-700"
          size="icon"
        >
          <MessageCircle className="h-6 w-6 text-white" />
        </Button>
      )}

      {/* Chat */}
      {isOpen && (
        <Card className="fixed bottom-6 right-6 z-50 h-[520px] max-h-[calc(100vh-3rem)] w-80 shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Bot className="h-4 w-4 text-blue-600" />
              Assistente Virtual
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="h-6 w-6"
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>

          <CardContent className="flex h-full flex-col p-0">
            {/* Mensagens */}
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
              {messages.map(message => (
                <div
                  key={message.id}
                  className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-3 py-2 ${
                      message.isBot ? 'bg-gray-100 text-gray-900' : 'bg-blue-600 text-white'
                    }`}
                  >
                    <div className="mb-1 flex items-center gap-2">
                      {message.isBot ? <Bot className="h-3 w-3" /> : <User className="h-3 w-3" />}
                      <span className="text-xs opacity-70">
                        {message.timestamp.toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-sm">{message.text}</p>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="rounded-lg bg-gray-100 px-3 py-2">
                    <div className="flex items-center gap-1">
                      <Bot className="h-3 w-3" />
                      <div className="flex space-x-1">
                        <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400"></div>
                        <div
                          className="h-2 w-2 animate-bounce rounded-full bg-gray-400"
                          style={{ animationDelay: '0.1s' }}
                        ></div>
                        <div
                          className="h-2 w-2 animate-bounce rounded-full bg-gray-400"
                          style={{ animationDelay: '0.2s' }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="flex-shrink-0 border-t p-4">
              <div className="flex gap-2">
                <Input
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Digite sua pergunta..."
                  className="flex-1"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim()}
                  size="icon"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>

              {/* Botão WhatsApp */}
              <Button
                onClick={openWhatsApp}
                variant="outline"
                className="mb-3 mt-2 w-full border-green-600 text-green-600 hover:bg-green-50"
              >
                💬 Falar com Suporte
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  )
}
