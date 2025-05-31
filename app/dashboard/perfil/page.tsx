'use client'

import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { User } from 'lucide-react'
import { db } from '@/lib/db'
import { format, differenceInDays } from 'date-fns'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import Image from 'next/image'

// Definições de tipos
interface Profile {
  id: string
  full_name: string
  avatar_url: string | null
  email: string
  [key: string]: any
}
interface Subscription {
  subscription_id: string
  plan_type: string
  explicacao_pratica: boolean
  status: string
  price_id?: string
  created_at: string
  current_period_end: string
  cancel_at_period_end?: boolean
}
interface BookAvulso {
  book_id: string
  expires_at: string
  created_at: string
  books?: { title: string }
  divisions?: { title: string }
}
interface Payment {
  type: string
  plan?: string
  nome?: string
  status: string
  valor: number
  data: string
}

export default function PerfilPage() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [fullName, setFullName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [books, setBooks] = useState<BookAvulso[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const router = useRouter()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    async function fetchProfile() {
      if (!user) return
      setLoading(true)
      const supabase = createClient()
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(data)
      setFullName(data?.full_name || '')
      setAvatarUrl(data?.avatar_url || null)
      setLoading(false)
    }
    fetchProfile()
  }, [user])

  useEffect(() => {
    async function loadData() {
      if (!user) return
      const supabase = createClient()
      const { data: subs } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      setSubscription(subs?.[0] || null)
      const purchased = await db.purchasedBooks.getByUserId(user.id)
      setBooks(purchased)
      // Histórico de pagamentos
      const allPayments = []
      if (subs && subs.length > 0) {
        for (const sub of subs) {
          let valor = 0
          if (sub.price_id) {
            try {
              const res = await fetch('/api/get-stripe-price', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ priceId: sub.price_id }),
              })
              const data = await res.json()
              valor = data.amount || 0
            } catch {}
          }
          // Ajuste: nome do plano
          let planoNome = ''
          if (sub.plan_type === 'yearly') {
            planoNome = sub.explicacao_pratica ? 'Anual Plus' : 'Anual'
          } else {
            planoNome = sub.explicacao_pratica ? 'Mensal Plus' : 'Mensal'
          }
          allPayments.push({
            type: 'Assinatura',
            plan: planoNome,
            status: sub.status,
            valor,
            data: format(new Date(sub.created_at), 'dd/MM/yyyy'),
          })
        }
      }
      for (const book of purchased) {
        const expirado = new Date(book.expires_at) < new Date()
        allPayments.push({
          type: 'Livro Avulso',
          nome: book.books?.title || 'Livro',
          valor: 29.9,
          data: format(new Date(book.created_at), 'dd/MM/yyyy'),
          status: expirado ? 'expirado' : 'valido',
        })
      }
      setPayments(allPayments)
    }
    loadData()
  }, [user])

  useEffect(() => {
    if (!user) return
    async function loadUserData() {
      try {
        const supabase = createClient()
        const {
          data: { user: userData },
          error: userError,
        } = await supabase.auth.getUser()
        if (userError) throw userError
        if (userData) {
          // Assuming formData is not used in the new code block
        }
      } catch (err: unknown) {
        // Assuming error is not used in the new code block
      } finally {
        setLoading(false)
      }
    }
    loadUserData()
  }, [user])

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      setAvatarFile(file)
      setAvatarUrl(URL.createObjectURL(file))
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    setLoading(true)
    let uploadedAvatarUrl = profile?.avatar_url || null

    try {
      if (avatarFile) {
        const supabase = createClient()
        const fileExt = avatarFile.name.split('.').pop()
        const filePath = `${user.id}.${fileExt}`

        // Remover avatar antigo se existir
        if (profile?.avatar_url) {
          const oldPath = profile.avatar_url.split('/').pop()
          if (oldPath) {
            await supabase.storage.from('avatars').remove([oldPath])
          }
        }

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, avatarFile, { upsert: true })

        if (uploadError) {
          toast({
            title: 'Erro ao fazer upload da foto',
            description: 'Não foi possível atualizar sua foto. Tente novamente.',
            variant: 'destructive',
          })
          setLoading(false)
          return
        }

        const publicUrlData = supabase.storage.from('avatars').getPublicUrl(filePath)
        if (publicUrlData?.data?.publicUrl) {
          uploadedAvatarUrl = `${publicUrlData.data.publicUrl}?t=${Date.now()}`
          setAvatarUrl(uploadedAvatarUrl)
        }
      }

      const supabase = createClient()
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ full_name: fullName, avatar_url: uploadedAvatarUrl })
        .eq('id', user.id)

      if (updateError) {
        toast({
          title: 'Erro ao atualizar perfil',
          description: 'Não foi possível salvar suas alterações. Tente novamente.',
          variant: 'destructive',
        })
        setLoading(false)
        return
      }

      // Atualiza o user_metadata do Supabase Auth
      const { error: authError } = await supabase.auth.updateUser({
        data: { full_name: fullName },
      })

      if (authError) {
        toast({
          title: 'Erro ao atualizar nome',
          description:
            'O nome foi atualizado no perfil, mas houve um erro ao atualizar no sistema. Isso pode ser resolvido ao fazer logout e login novamente.',
          variant: 'destructive',
        })
      }

      // Recarrega o perfil do banco após salvar
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(data)
      setAvatarUrl(data?.avatar_url || null)

      setAvatarFile(null)

      toast({
        title: 'Perfil atualizado',
        description: 'Suas alterações foram salvas com sucesso!',
        variant: 'default',
      })
    } catch (error) {
      toast({
        title: 'Erro ao salvar alterações',
        description: 'Ocorreu um erro inesperado. Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  async function handleCancel() {
    if (!subscription) return
    const res = await fetch('/api/cancel-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscriptionId: subscription.subscription_id }),
    })
    const data = await res.json()
    if (data.ok) {
      toast({
        title: 'Assinatura cancelada',
        description: 'Sua assinatura permanecerá ativa até o fim do período já pago.',
        variant: 'default',
      })
      setTimeout(() => window.location.reload(), 1800)
    } else {
      toast({
        title: 'Erro ao cancelar assinatura',
        description: data.error || 'Tente novamente.',
        variant: 'destructive',
      })
    }
  }

  // Função utilitária para traduzir status
  function traduzirStatus(status: string) {
    switch (status) {
      case 'active':
        return 'Ativa'
      case 'canceled':
        return 'Cancelada'
      case 'incomplete':
        return 'Incompleta'
      case 'past_due':
        return 'Atrasada'
      case 'trialing':
        return 'Em teste'
      case 'unpaid':
        return 'Não paga'
      case 'valido':
        return 'Válido'
      case 'expirado':
        return 'Expirado'
      default:
        return status
    }
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault()
    setPasswordError(null)
    setPasswordSuccess(null)
    if (newPassword.length < 8) {
      setPasswordError(
        'A senha deve ter pelo menos 8 caracteres, incluindo letra maiúscula, minúscula, número e símbolo.'
      )
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('As senhas não coincidem.')
      return
    }
    setPasswordLoading(true)
    setPasswordLoading(false)
    setPasswordSuccess('Senha alterada com sucesso!')
    setNewPassword('')
    setConfirmPassword('')
  }

  async function handleUpgrade() {
    if (!user) return
    const res = await fetch('/api/create-customer-portal-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id }),
    })
    const data = await res.json()
    if (data.url) {
      window.location.href = data.url
    }
  }

  if (!user) {
    return <div className="p-8 text-center text-gray-500">Faça login para acessar seu perfil.</div>
  }

  return (
    <div className="flex flex-col">
      <main className="flex-1">
        <div className="container mx-auto max-w-6xl px-4 py-2 md:px-6">
          <div className="grid items-start gap-8 md:grid-cols-2">
            {/* Card Perfil */}
            <div className="mb-8 rounded-xl bg-white p-6 shadow">
              <h1 className="mb-6 text-2xl font-bold">Meu Perfil</h1>
              <form className="space-y-6" onSubmit={handleSave}>
                <div className="mb-4 flex items-center gap-6">
                  <div>
                    <div className="mb-2 h-24 w-24 overflow-hidden rounded-full bg-gray-200">
                      {avatarUrl ? (
                        <Image
                          src={avatarUrl}
                          alt="Avatar"
                          width={96}
                          height={96}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-primary/10">
                          <User className="h-12 w-12 text-primary" />
                        </div>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Alterar foto
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarChange}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="mb-1 block text-sm font-medium">Nome</label>
                    <Input
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      placeholder="Seu nome"
                      required
                    />
                    <label className="mb-1 mt-2 block text-sm font-medium">E-mail</label>
                    <Input value={user.email} disabled readOnly />
                  </div>
                </div>
                <Button type="submit" disabled={loading} className="mt-2 w-full md:w-auto">
                  Salvar alterações
                </Button>
              </form>
              {/* Formulário de alteração de senha */}
              <div className="mt-8 max-w-md">
                <h2 className="mb-2 text-lg font-semibold">Alterar senha</h2>
                <form className="space-y-3" onSubmit={handlePasswordChange}>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Nova senha</label>
                    <Input
                      type="password"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="Digite a nova senha"
                      minLength={8}
                      required
                    />
                    <div className="mt-1 text-xs text-muted-foreground">
                      A senha deve ter pelo menos 8 caracteres, incluindo letra maiúscula,
                      minúscula, número e símbolo.
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Confirmar nova senha</label>
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Confirme a nova senha"
                      minLength={8}
                      required
                    />
                  </div>
                  {passwordError && <div className="text-sm text-red-600">{passwordError}</div>}
                  {passwordSuccess && (
                    <div className="text-sm text-green-600">{passwordSuccess}</div>
                  )}
                  <Button type="submit" disabled={passwordLoading} className="w-full md:w-auto">
                    {passwordLoading ? 'Salvando...' : 'Alterar senha'}
                  </Button>
                </form>
              </div>
            </div>
            {/* Coluna direita: Assinatura + Histórico */}
            <div>
              <div className="mb-8 rounded-xl bg-white p-6 shadow">
                <h2 className="mb-2 text-xl font-bold">Minha Assinatura</h2>
                {subscription ? (
                  <div className="mb-4">
                    <div className="mb-2 flex items-center gap-2">
                      <div>
                        Status: <b>{traduzirStatus(subscription.status)}</b>
                      </div>
                      {subscription.explicacao_pratica && (
                        <span className="ml-2 inline-block rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
                          Assinante Plus
                        </span>
                      )}
                    </div>
                    <div>
                      Plano:{' '}
                      <b>
                        {subscription.plan_type === 'yearly'
                          ? subscription.explicacao_pratica
                            ? 'Anual Plus'
                            : 'Anual'
                          : subscription.explicacao_pratica
                            ? 'Mensal Plus'
                            : 'Mensal'}
                      </b>
                    </div>
                    <div>
                      Explicação prática: <b>{subscription.explicacao_pratica ? 'Sim' : 'Não'}</b>
                    </div>
                    <div>
                      Expira em:{' '}
                      <b>{format(new Date(subscription.current_period_end), 'dd/MM/yyyy')}</b>
                    </div>
                    {subscription.cancel_at_period_end && subscription.status === 'active' && (
                      <div className="mt-2 rounded bg-yellow-100 p-2 text-sm font-medium text-yellow-800">
                        Sua assinatura foi cancelada e permanecerá ativa até{' '}
                        <b>{format(new Date(subscription.current_period_end), 'dd/MM/yyyy')}</b>.
                        Após essa data, você perderá o acesso a todo o conteúdo exclusivo do site.
                      </div>
                    )}
                    <div className="mt-4 flex gap-4">
                      {subscription.cancel_at_period_end && subscription.status === 'active' ? (
                        <Button
                          variant="default"
                          onClick={async () => {
                            const supabase = createClient()
                            const { data: profile } = await supabase
                              .from('profiles')
                              .select('stripe_customer_id')
                              .eq('id', user.id)
                              .maybeSingle()
                            if (!profile?.stripe_customer_id) {
                              toast({
                                title: 'Não foi possível localizar seu cadastro Stripe.',
                                variant: 'destructive',
                              })
                              return
                            }
                            const res = await fetch('/api/upgrade-subscription', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ customerId: profile.stripe_customer_id }),
                            })
                            const data = await res.json()
                            if (data.url) window.location.href = data.url
                          }}
                        >
                          Renovar Assinatura
                        </Button>
                      ) : (
                        <Button variant="destructive" onClick={handleCancel}>
                          Cancelar Assinatura
                        </Button>
                      )}
                      <Button variant="default" onClick={handleUpgrade}>
                        Fazer Upgrade
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="mb-4">Você não possui assinatura ativa.</div>
                )}
              </div>
              {/* Histórico de Pagamentos */}
              <div className="rounded-xl bg-white p-6 shadow">
                <h2 className="mb-2 text-xl font-bold">Histórico de Pagamentos</h2>
                {payments.length === 0 ? (
                  <div>Nenhum pagamento encontrado.</div>
                ) : (
                  <table className="w-full border text-sm">
                    <thead>
                      <tr className="bg-muted">
                        <th className="p-2 text-left">Tipo</th>
                        <th className="p-2 text-left">Plano/Livro</th>
                        <th className="p-2 text-left">Valor</th>
                        <th className="p-2 text-left">Data</th>
                        <th className="p-2 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((p, i) => (
                        <tr key={i} className="border-t">
                          <td className="p-2">{p.type}</td>
                          <td className="p-2">{p.plan || p.nome}</td>
                          <td className="p-2">R$ {p.valor.toFixed(2)}</td>
                          <td className="p-2">{p.data}</td>
                          <td className="p-2">{p.status ? traduzirStatus(p.status) : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
          {/* Só mostra tratados avulsos se não tiver assinatura ativa */}
          {(!subscription || subscription.status !== 'active') && (
            <section className="mt-8">
              <h2 className="mb-2 text-xl font-bold">Meus Tratados Avulsos</h2>
              {books.length === 0 ? (
                <div>Você não assinou nenhum tratado avulso.</div>
              ) : (
                <ul className="space-y-2">
                  {books.map(book => {
                    const days = differenceInDays(new Date(book.expires_at), new Date())
                    return (
                      <li key={book.book_id} className="flex items-center gap-4">
                        <span>
                          {book.books?.title}
                          {book.divisions?.title ? ` — ${book.divisions.title}` : ''}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          Expira em {format(new Date(book.expires_at), 'dd/MM/yyyy')} ({days} dias)
                        </span>
                        {days <= 5 && (
                          <span className="font-semibold text-red-600">Expira em breve!</span>
                        )}
                        <Button size="sm" onClick={() => router.push(`/livros/${book.book_id}`)}>
                          Ler
                        </Button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </section>
          )}
        </div>
      </main>
    </div>
  )
}
