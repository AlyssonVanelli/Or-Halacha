'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { X, BookOpen, Clock, CheckCircle } from 'lucide-react'

interface Treatise {
  id: string
  name: string
  description: string
  price: number
  estimated_duration: string
  difficulty: 'iniciante' | 'intermediario' | 'avancado'
}

interface TreatiseSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (treatiseId: string) => void
  loading: boolean
}

export default function TreatiseSelectionModal({
  isOpen,
  onClose,
  onSelect,
  loading,
}: TreatiseSelectionModalProps) {
  const [treatises, setTreatises] = useState<Treatise[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadTreatises()
    }
  }, [isOpen])

  async function loadTreatises() {
    setIsLoading(true)
    try {
      const supabase = createClient()

      // Buscar divisões (tratados) disponíveis
      const { data: divisions, error } = await supabase
        .from('divisions')
        .select('id, title, description')
        .order('title')

      if (error) {
        console.error('Erro ao carregar tratados:', error)
        return
      }

      // Mapear para o formato esperado
      const treatiseList: Treatise[] =
        divisions?.map(div => ({
          id: div.id,
          name: div.title,
          description: div.description || 'Tratado do Shulchan Aruch',
          price: 29.9, // Preço fixo para tratado avulso
          estimated_duration: '1 mês',
          difficulty: 'intermediario' as const,
        })) || []

      setTreatises(treatiseList)
    } catch (error) {
      console.error('Erro ao carregar tratados:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-lg bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b p-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Escolha um Tratado</h2>
            <p className="mt-1 text-gray-600">
              Selecione o tratado que deseja adquirir individualmente
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} disabled={loading}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="max-h-[calc(90vh-140px)] overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Carregando tratados...</span>
            </div>
          ) : treatises.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="text-center text-gray-500">
                <p className="mb-2 text-lg font-medium">Nenhum tratado disponível</p>
                <p className="text-sm">Entre em contato com o suporte para mais informações.</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {treatises.map(treatise => (
                <Card
                  key={treatise.id}
                  className="cursor-pointer border-2 transition-shadow hover:border-blue-200 hover:shadow-lg"
                  onClick={() => onSelect(treatise.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg text-gray-900">{treatise.name}</CardTitle>
                        <CardDescription className="mt-1">{treatise.description}</CardDescription>
                      </div>
                      <Badge variant="secondary" className="ml-2">
                        R$ {treatise.price.toFixed(2)}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="mr-2 h-4 w-4" />
                        <span>Acesso por {treatise.estimated_duration}</span>
                      </div>

                      <div className="flex items-center text-sm text-gray-600">
                        <BookOpen className="mr-2 h-4 w-4" />
                        <span className="capitalize">{treatise.difficulty}</span>
                      </div>

                      <div className="flex items-center text-sm text-green-600">
                        <CheckCircle className="mr-2 h-4 w-4" />
                        <span>Conteúdo completo</span>
                      </div>
                    </div>

                    <Button className="mt-4 w-full" disabled={loading}>
                      {loading ? 'Processando...' : 'Selecionar Tratado'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t bg-gray-50 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              💡 Você terá acesso completo ao tratado selecionado por 1 mês
            </p>
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
