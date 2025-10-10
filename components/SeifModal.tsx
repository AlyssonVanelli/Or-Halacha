import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Star } from 'lucide-react'
import { useState } from 'react'

interface SeifModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tratado: string
  siman: string
  seif: string
  content: string
  isFavorite: boolean
  onFavorite: () => void
  onGoToSiman: () => void
  explicacaoPratica?: string | undefined
  onVerExplicacaoPratica?: () => void
  loadingExplicacao?: boolean
  plusWarning?: string | undefined
}

export function SeifModal({
  open,
  onOpenChange,
  tratado,
  siman,
  seif,
  content,
  isFavorite,
  onFavorite,
  onGoToSiman,
  explicacaoPratica,
  onVerExplicacaoPratica,
  loadingExplicacao,
}: SeifModalProps) {
  const [showExplicacao, setShowExplicacao] = useState(false)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {tratado} - Siman {siman}
            {seif && `, Seif ${seif}`}
          </DialogTitle>
        </DialogHeader>
        <div className="mb-4">
          <div className="mb-2 flex items-center gap-2 font-semibold">
            <button
              onClick={onFavorite}
              className="ml-2 flex items-center gap-1"
              title={isFavorite ? 'Remover dos favoritos' : 'Favoritar'}
            >
              <Star
                className={isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}
                fill={isFavorite ? '#facc15' : 'none'}
              />
              {isFavorite ? 'Favorito' : 'Favoritar'}
            </button>
            <Button variant="outline" onClick={onGoToSiman}>
              Ir para Siman
            </Button>
          </div>
          <div className="whitespace-pre-line rounded-md bg-muted p-4 text-base font-medium max-h-64 overflow-y-auto">
            {content}
          </div>
        </div>
        {onVerExplicacaoPratica && (
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => {
                setShowExplicacao(true)
                onVerExplicacaoPratica()
              }}
              disabled={loadingExplicacao}
            >
              {loadingExplicacao ? 'Carregando...' : 'Ver explicação prática'}
            </Button>
          </DialogFooter>
        )}
        {showExplicacao && explicacaoPratica && (
          <div className="mt-4 rounded bg-blue-50 p-4 text-blue-900 max-h-96 overflow-y-auto">
            <strong>Explicação prática:</strong>
            <div className="mt-2 whitespace-pre-line">{explicacaoPratica}</div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
