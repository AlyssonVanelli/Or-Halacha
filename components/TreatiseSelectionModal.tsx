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
  loading 
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
      const treatiseList: Treatise[] = divisions?.map(div => ({
        id: div.id,
        name: div.title,
        description: div.description || 'Tratado do Shulchan Aruch',
        price: 29.90, // Preço fixo para tratado avulso
        estimated_duration: '1 mês',
        difficulty: 'intermediario' as const
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Escolha um Tratado</h2>
            <p className="text-gray-600 mt-1">
              Selecione o tratado que deseja adquirir individualmente
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            disabled={loading}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Carregando tratados...</span>
            </div>
          ) : treatises.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="text-gray-500 text-center">
                <p className="text-lg font-medium mb-2">Nenhum tratado disponível</p>
                <p className="text-sm">Entre em contato com o suporte para mais informações.</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {treatises.map((treatise) => (
                <Card 
                  key={treatise.id} 
                  className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-blue-200"
                  onClick={() => onSelect(treatise.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg text-gray-900">
                          {treatise.name}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {treatise.description}
                        </CardDescription>
                      </div>
                      <Badge variant="secondary" className="ml-2">
                        R$ {treatise.price.toFixed(2)}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="h-4 w-4 mr-2" />
                        <span>Acesso por {treatise.estimated_duration}</span>
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-600">
                        <BookOpen className="h-4 w-4 mr-2" />
                        <span className="capitalize">{treatise.difficulty}</span>
                      </div>

                      <div className="flex items-center text-sm text-green-600">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        <span>Conteúdo completo</span>
                      </div>
                    </div>

                    <Button 
                      className="w-full mt-4"
                      disabled={loading}
                    >
                      {loading ? 'Processando...' : 'Selecionar Tratado'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-4 bg-gray-50">
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
