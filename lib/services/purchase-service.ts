import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/supabase/database.types'

type PurchasedBook = Database['public']['Tables']['purchased_books']['Row']
type PurchasedBookInsert = Database['public']['Tables']['purchased_books']['Insert']

export class PurchaseService {
  private supabase = createClient()

  // Criar compra de livro avulso
  async createPurchase(data: PurchasedBookInsert): Promise<PurchasedBook> {
    try {
      const { data: purchase, error } = await this.supabase
        .from('purchased_books')
        .insert(data)
        .select()
        .single()

      if (error) {
        console.error('Erro ao salvar compra:', error)
        throw new Error('Erro ao salvar compra no banco de dados')
      }

      return purchase
    } catch (error) {
      console.error('Erro no PurchaseService.createPurchase:', error)
      throw error
    }
  }

  // Buscar compras do usuário
  async getUserPurchases(userId: string): Promise<PurchasedBook[]> {
    try {
      const { data: purchases, error } = await this.supabase
        .from('purchased_books')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Erro ao buscar compras:', error)
        return []
      }

      return purchases || []
    } catch (error) {
      console.error('Erro no PurchaseService.getUserPurchases:', error)
      return []
    }
  }

  // Verificar se usuário tem acesso a uma divisão específica
  async hasAccessToDivision(userId: string, divisionId: string): Promise<boolean> {
    try {
      const { data: purchase, error } = await this.supabase
        .from('purchased_books')
        .select('expires_at')
        .eq('user_id', userId)
        .eq('division_id', divisionId)
        .maybeSingle()

      if (error || !purchase) {
        return false
      }

      // Verificar se não expirou
      return new Date(purchase.expires_at) > new Date()
    } catch (error) {
      console.error('Erro no PurchaseService.hasAccessToDivision:', error)
      return false
    }
  }

  // Verificar se usuário tem acesso a um livro específico
  async hasAccessToBook(userId: string, bookId: string): Promise<boolean> {
    try {
      const { data: purchases, error } = await this.supabase
        .from('purchased_books')
        .select('expires_at')
        .eq('user_id', userId)
        .eq('book_id', bookId)

      if (error || !purchases || purchases.length === 0) {
        return false
      }

      // Verificar se pelo menos uma compra não expirou
      return purchases.some(purchase => new Date(purchase.expires_at) > new Date())
    } catch (error) {
      console.error('Erro no PurchaseService.hasAccessToBook:', error)
      return false
    }
  }

  // Obter divisões compradas e ativas
  async getActivePurchases(userId: string): Promise<PurchasedBook[]> {
    try {
      const { data: purchases, error } = await this.supabase
        .from('purchased_books')
        .select('*')
        .eq('user_id', userId)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Erro ao buscar compras ativas:', error)
        return []
      }

      return purchases || []
    } catch (error) {
      console.error('Erro no PurchaseService.getActivePurchases:', error)
      return []
    }
  }

  // Obter divisões compradas para um livro específico
  async getBookPurchases(userId: string, bookId: string): Promise<PurchasedBook[]> {
    try {
      const { data: purchases, error } = await this.supabase
        .from('purchased_books')
        .select('*')
        .eq('user_id', userId)
        .eq('book_id', bookId)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Erro ao buscar compras do livro:', error)
        return []
      }

      return purchases || []
    } catch (error) {
      console.error('Erro no PurchaseService.getBookPurchases:', error)
      return []
    }
  }

  // Verificar se usuário tem qualquer tipo de acesso (assinatura ou compra)
  async hasAnyAccess(userId: string): Promise<{
    hasAccess: boolean
    accessType: 'subscription' | 'purchase' | 'none'
    details: {
      hasActiveSubscription?: boolean
      hasActivePurchases?: boolean
      purchasedDivisions?: string[]
    }
  }> {
    try {
      // Verificar assinatura ativa
      const { data: subscription } = await this.supabase
        .from('subscriptions')
        .select('status, current_period_end')
        .eq('user_id', userId)
        .eq('status', 'active')
        .maybeSingle()

      const hasActiveSubscription =
        subscription &&
        (subscription.current_period_end
          ? new Date(subscription.current_period_end) > new Date()
          : true)

      if (hasActiveSubscription) {
        return {
          hasAccess: true,
          accessType: 'subscription',
          details: {
            hasActiveSubscription: true,
          },
        }
      }

      // Verificar compras ativas
      const activePurchases = await this.getActivePurchases(userId)
      const hasActivePurchases = activePurchases.length > 0

      return {
        hasAccess: hasActivePurchases,
        accessType: hasActivePurchases ? 'purchase' : 'none',
        details: {
          hasActiveSubscription: false,
          hasActivePurchases,
          purchasedDivisions: activePurchases.map(p => p.division_id),
        },
      }
    } catch (error) {
      console.error('Erro no PurchaseService.hasAnyAccess:', error)
      return {
        hasAccess: false,
        accessType: 'none',
        details: {},
      }
    }
  }

  // Criar compra baseada em payment intent do Stripe
  async createPurchaseFromPaymentIntent(
    userId: string,
    paymentIntentId: string,
    divisionId: string,
    bookId: string = 'shulchan-aruch'
  ): Promise<PurchasedBook> {
    try {
      // Calcular data de expiração (1 ano a partir de agora)
      const expiresAt = new Date()
      expiresAt.setFullYear(expiresAt.getFullYear() + 1)

      const purchaseData: PurchasedBookInsert = {
        user_id: userId,
        book_id: bookId,
        division_id: divisionId,
        expires_at: expiresAt.toISOString(),
        stripe_payment_intent_id: paymentIntentId,
      }

      return await this.createPurchase(purchaseData)
    } catch (error) {
      console.error('Erro no PurchaseService.createPurchaseFromPaymentIntent:', error)
      throw error
    }
  }
}

// Instância singleton do serviço
export const purchaseService = new PurchaseService()
