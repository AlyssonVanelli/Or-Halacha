'use client'

import { useState } from 'react'
import { List, Eye, EyeOff, ChevronDown, ChevronRight } from 'lucide-react'
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
  rawContent,
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
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-500"></div>
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
            <h2 className="mb-3 text-2xl font-bold text-gray-800">{parsedSiman.title}</h2>
            <p className="mb-4 leading-relaxed text-gray-600">{parsedSiman.summary}</p>

            {/* Tópicos do Siman */}
            {parsedSiman.topics.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {parsedSiman.topics.slice(0, 8).map((topic, index) => (
                  <span
                    key={index}
                    className="rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800"
                  >
                    {topic}
                  </span>
                ))}
                {parsedSiman.topics.length > 8 && (
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600">
                    +{parsedSiman.topics.length - 8} mais
                  </span>
                )}
              </div>
            )}
          </div>

          <button
            onClick={() => setShowTopics(!showTopics)}
            className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 shadow-sm transition-shadow hover:shadow-md"
          >
            {showTopics ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            {showTopics ? 'Ocultar' : 'Mostrar'} Tópicos
          </button>
        </div>
      </div>

      {/* Lista de Seifim */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-xl font-semibold text-gray-800">
            <List className="h-5 w-5" />
            Seifim ({parsedSiman.seifim.length})
          </h3>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            {isExpanded ? 'Recolher' : 'Expandir'} Todos
          </button>
        </div>

        {parsedSiman.seifim.map(seif => (
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
    <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-lg">
      {/* Header do Seif */}
      <div className="cursor-pointer p-4 transition-colors hover:bg-gray-50" onClick={onToggle}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-blue-500 px-3 py-1 text-sm font-bold text-white">
              {seif.position}
            </div>
            <h4 className="text-lg font-semibold text-gray-800">{seif.title}</h4>
          </div>
          {isExpanded ? (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronRight className="h-5 w-5 text-gray-400" />
          )}
        </div>

        {/* Resumo do Seif */}
        <p className="mt-2 text-sm text-gray-600">{seif.summary}</p>

        {/* Tópicos do Seif */}
        {showTopics && seif.topics.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {seif.topics.slice(0, 5).map((topic, index) => (
              <span
                key={index}
                className="rounded-full bg-indigo-100 px-2 py-1 text-xs text-indigo-700"
              >
                {topic}
              </span>
            ))}
            {seif.topics.length > 5 && (
              <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600">
                +{seif.topics.length - 5}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Conteúdo do Seif */}
      {isExpanded && (
        <div className="border-t border-gray-100 px-4 pb-4">
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
