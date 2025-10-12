'use client'

import { useState } from 'react'
import { Book, List, Eye, EyeOff, ChevronDown, ChevronRight } from 'lucide-react'
import { parseSimanContent, ParsedSiman, ParsedSeif } from '@/lib/content-parser'

interface ContentOrganizerProps {
  simanId: string
  simanTitle: string
  simanPosition: number
  rawContent: string
}

export default function ContentOrganizer({
  simanId,
  simanTitle,
  simanPosition,
  rawContent
}: ContentOrganizerProps) {
  const [parsedSiman, setParsedSiman] = useState<ParsedSiman | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [showTopics, setShowTopics] = useState(true)
  const [expandedSeifim, setExpandedSeifim] = useState<Set<string>>(new Set())

  // Parse do conteúdo quando o componente monta
  useState(() => {
    const parsed = parseSimanContent(simanId, simanTitle, simanPosition, rawContent)
    setParsedSiman(parsed)
  })

  const toggleSeif = (seifId: string) => {
    const newExpanded = new Set(expandedSeifim)
    if (newExpanded.has(seifId)) {
      newExpanded.delete(seifId)
    } else {
      newExpanded.add(seifId)
    }
    setExpandedSeifim(newExpanded)
  }

  if (!parsedSiman) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-gray-600">Organizando conteúdo...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header com resumo e tópicos */}
      <div className="rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-800 mb-3">
              {parsedSiman.title}
            </h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              {parsedSiman.summary}
            </p>
            
            {/* Tópicos do Siman */}
            {parsedSiman.topics.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {parsedSiman.topics.slice(0, 8).map((topic, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                  >
                    {topic}
                  </span>
                ))}
                {parsedSiman.topics.length > 8 && (
                  <span className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">
                    +{parsedSiman.topics.length - 8} mais
                  </span>
                )}
              </div>
            )}
          </div>
          
          <button
            onClick={() => setShowTopics(!showTopics)}
            className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
          >
            {showTopics ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            {showTopics ? 'Ocultar' : 'Mostrar'} Tópicos
          </button>
        </div>
      </div>

      {/* Lista de Seifim */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <List className="h-5 w-5" />
            Seifim ({parsedSiman.seifim.length})
          </h3>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            {isExpanded ? 'Recolher' : 'Expandir'} Todos
          </button>
        </div>

        {parsedSiman.seifim.map((seif) => (
          <SeifCard
            key={seif.id}
            seif={seif}
            isExpanded={expandedSeifim.has(seif.id)}
            onToggle={() => toggleSeif(seif.id)}
            showTopics={showTopics}
          />
        ))}
      </div>
    </div>
  )
}

interface SeifCardProps {
  seif: ParsedSeif
  isExpanded: boolean
  onToggle: () => void
  showTopics: boolean
}

function SeifCard({ seif, isExpanded, onToggle, showTopics }: SeifCardProps) {
  return (
    <div className="rounded-xl bg-white shadow-lg border border-gray-100 overflow-hidden">
      {/* Header do Seif */}
      <div
        className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-blue-500 text-white px-3 py-1 text-sm font-bold">
              Seif {seif.position}
            </div>
            <h4 className="text-lg font-semibold text-gray-800">
              {seif.title}
            </h4>
          </div>
          {isExpanded ? (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronRight className="h-5 w-5 text-gray-400" />
          )}
        </div>
        
        {/* Resumo do Seif */}
        <p className="text-gray-600 mt-2 text-sm">
          {seif.summary}
        </p>
        
        {/* Tópicos do Seif */}
        {showTopics && seif.topics.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {seif.topics.slice(0, 5).map((topic, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-full"
              >
                {topic}
              </span>
            ))}
            {seif.topics.length > 5 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                +{seif.topics.length - 5}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Conteúdo do Seif */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-100">
          <div className="prose prose-lg max-w-none pt-4">
            <div
              className="leading-relaxed text-gray-700"
              dangerouslySetInnerHTML={{ __html: seif.content }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
