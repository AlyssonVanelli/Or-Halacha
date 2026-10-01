'use client'

import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { User, Home, ChevronRight } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import Image from 'next/image'
import Link from 'next/link'
import { BillingSection } from '@/components/BillingSection'
import { DeleteAccountSection } from '@/components/DeleteAccountSection'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'

// Definições de tipos
interface Profile {
  id: string
  full_name: string
  avatar_url: string | null
  email: string
}
export default function PerfilPage() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [fullName, setFullName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)
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
      // Validar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Arquivo inválido',
          description: 'Por favor, selecione apenas arquivos de imagem.',
          variant: 'destructive',
        })
        return
      }

      // Validar tamanho (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'Arquivo muito grande',
          description: 'A imagem deve ter no máximo 5MB.',
          variant: 'destructive',
        })
        return
      }

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
      } else {
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
    const { error } = await createClient().auth.updateUser({ password: newPassword })
    setPasswordLoading(false)
    if (error) {
      setPasswordError('Não foi possível alterar a senha. Tente novamente.')
      return
    }
    setPasswordSuccess('Senha alterada com sucesso!')
    setNewPassword('')
    setConfirmPassword('')
  }

  if (!user) {
    return <div className="p-8 text-center text-gray-500">Faça login para acessar seu perfil.</div>
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-blue-50 to-indigo-100">
      <main className="flex-1">
        <div className="container mx-auto max-w-6xl px-4 py-8 md:px-6">
          {/* Breadcrumbs */}
          <Breadcrumb className="mb-8">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-1 text-blue-600 transition-colors duration-200 hover:text-blue-700"
                  >
                    <Home className="h-4 w-4" />
                    Dashboard
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator>
                <ChevronRight className="h-4 w-4" />
              </BreadcrumbSeparator>
              <BreadcrumbItem>
                <BreadcrumbPage className="flex items-center gap-1 text-gray-600">
                  <User className="h-4 w-4" />
                  Perfil
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="grid items-start gap-8 md:grid-cols-2">
            {/* Card Perfil */}
            <div className="mb-8 rounded-xl border-0 bg-gradient-to-br from-white to-blue-50/30 p-8 shadow-xl transition-all duration-300 hover:shadow-2xl">
              <h1 className="mb-8 bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-3xl font-bold text-transparent">
                Meu Perfil
              </h1>
              <form className="space-y-6" onSubmit={handleSave}>
                <div className="mb-6 flex items-center gap-8">
                  <div>
                    <div className="mb-3 h-28 w-28 overflow-hidden rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 shadow-lg">
                      {avatarUrl ? (
                        <Image
                          src={avatarUrl}
                          alt="Avatar"
                          width={112}
                          height={112}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600">
                          <User className="h-14 w-14 text-white" />
                        </div>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-blue-200 transition-all duration-200 hover:border-blue-500 hover:bg-blue-50"
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
                  <div className="flex flex-col gap-4">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-gray-700">Nome</label>
                      <Input
                        value={fullName}
                        onChange={e => setFullName(e.target.value)}
                        placeholder="Seu nome"
                        required
                        className="h-12 border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 transition-all duration-200 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-gray-700">
                        E-mail
                      </label>
                      <Input
                        value={user.email}
                        disabled
                        readOnly
                        className="h-12 border-2 border-gray-200 bg-gray-100"
                      />
                    </div>
                  </div>
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="h-12 w-full bg-gradient-to-r from-blue-600 to-blue-700 text-base font-semibold shadow-md transition-all duration-200 hover:from-blue-700 hover:to-blue-800 hover:shadow-lg"
                >
                  {loading ? 'Salvando...' : 'Salvar alterações'}
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
                <DeleteAccountSection />
              </div>
            </div>
            {/* Coluna direita: assinatura, tratados e pagamentos (gerenciados pela Hotmart) */}
            <BillingSection />
          </div>
        </div>
      </main>
    </div>
  )
}
