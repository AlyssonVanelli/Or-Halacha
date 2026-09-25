'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'

// Exclusão de conta pelo próprio usuário (LGPD)
export function DeleteAccountSection() {
  const [open, setOpen] = useState(false)
  const [confirmation, setConfirmation] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  async function deleteAccount() {
    setDeleting(true)
    setError('')
    const res = await fetch('/api/account/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirmation }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      setDeleting(false)
      setError(data.error || 'Não foi possível excluir a conta.')
      return
    }
    await createClient()
      .auth.signOut()
      .catch(() => undefined)
    window.location.href = '/?conta=excluida'
  }

  return (
    <div className="mt-8 border-t pt-6">
      <h2 className="mb-2 text-lg font-semibold text-red-700">Excluir minha conta</h2>
      {!open ? (
        <>
          <p className="mb-3 text-sm text-gray-600">
            Apaga seu perfil, favoritos e acessos, e cancela qualquer assinatura ativa.
          </p>
          <Button
            variant="outline"
            className="border-red-300 text-red-700"
            onClick={() => setOpen(true)}
          >
            Quero excluir minha conta
          </Button>
        </>
      ) : (
        <div className="space-y-3 rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-900">
            Esta ação não pode ser desfeita. Sua assinatura será cancelada na hora, sem reembolso
            automático (para reembolso dentro de 7 dias, use “Solicitar reembolso” antes). Para
            confirmar, digite <b>EXCLUIR</b>.
          </p>
          <label htmlFor="confirmar-exclusao" className="sr-only">
            Digite EXCLUIR para confirmar
          </label>
          <Input
            id="confirmar-exclusao"
            value={confirmation}
            onChange={e => setConfirmation(e.target.value)}
            placeholder="EXCLUIR"
            autoComplete="off"
          />
          {error && (
            <p className="text-sm text-red-700" role="alert">
              {error}
            </p>
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={deleting}>
              Voltar
            </Button>
            <Button
              variant="destructive"
              onClick={deleteAccount}
              disabled={deleting || confirmation.trim().toUpperCase() !== 'EXCLUIR'}
            >
              {deleting ? 'Excluindo…' : 'Excluir definitivamente'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
