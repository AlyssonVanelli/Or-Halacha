import { createClient } from '@/lib/supabase/client'
import { stripe } from '@/lib/stripe'
import { Database } from '@/lib/supabase/database.types'

type Subscription = Database['public']['Tables']['subscriptions']['Row']
type SubscriptionInsert = Database['public']['Tables']['subscriptions']['Insert']
// type SubscriptionUpdate = Database['public']['Tables']['subscriptions']['Update']

export class SubscriptionService {
  private supabase = createClient()

  // Criar ou atualizar assinatura no banco
  async upsertSubscription(data: SubscriptionInsert): Promise<Subscription> {
    try {
      const { data: subscription, error } = await this.supabase
        .from('subscriptions')
        .upsert(data, { onConflict: 'user_id' })
        .select()
        .single()

      if (error) {
        console.error('Erro ao salvar assinatura:', error)
        throw new Error('Erro ao salvar assinatura no banco de dados')
      }

      return subscription
    } catch (error) {
      console.error('Erro no SubscriptionService.upsertSubscription:', error)
      throw error
    }
  }

  // Buscar assinatura por user_id
  async getSubscriptionByUserId(userId: string): Promise<Subscription | null> {
    try {
      const { data: subscription, error } = await this.supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()

      if (error) {
        console.error('Erro ao buscar assinatura:', error)
        return null
      }

      return subscription
    } catch (error) {
      console.error('Erro no SubscriptionService.getSubscriptionByUserId:', error)
      return null
    }
  }

  // Buscar assinatura por subscription_id
  async getSubscriptionByStripeId(subscriptionId: string): Promise<Subscription | null> {
    try {
      const { data: subscription, error } = await this.supabase
        .from('subscriptions')
        .select('*')
        .eq('subscription_id', subscriptionId)
        .maybeSingle()

      if (error) {
        console.error('Erro ao buscar assinatura por Stripe ID:', error)
        return null
      }

      return subscription
    } catch (error) {
      console.error('Erro no SubscriptionService.getSubscriptionByStripeId:', error)
      return null
    }
  }

  // Verificar se usuário tem assinatura ativa
  async hasActiveSubscription(userId: string): Promise<boolean> {
    try {
      const subscription = await this.getSubscriptionByUserId(userId)

      if (!subscription) {
        return false
      }

      // Verificar se está ativa e não expirou
      const isActive = subscription.status === 'active' || subscription.status === 'trialing'
      const isNotExpired = subscription.current_period_end
        ? new Date(subscription.current_period_end) > new Date()
        : true

      return isActive && isNotExpired
    } catch (error) {
      console.error('Erro no SubscriptionService.hasActiveSubscription:', error)
      return false
    }
  }

  // Verificar se usuário tem assinatura Plus
  async hasPlusSubscription(userId: string): Promise<boolean> {
    try {
      const subscription = await this.getSubscriptionByUserId(userId)

      if (!subscription) {
        return false
      }

      const isActive = await this.hasActiveSubscription(userId)
      return isActive && subscription.explicacao_pratica === true
    } catch (error) {
      console.error('Erro no SubscriptionService.hasPlusSubscription:', error)
      return false
    }
  }

  // Sincronizar assinatura com Stripe
  async syncWithStripe(subscriptionId: string): Promise<Subscription | null> {
    try {
      console.log('=== SINCRONIZANDO ASSINATURA COM STRIPE ===')
      console.log('Subscription ID:', subscriptionId)

      // Buscar assinatura no Stripe
      const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId)

      console.log('Dados do Stripe:')
      console.log('- Status:', stripeSubscription.status)
      console.log('- Customer:', stripeSubscription.customer)
      console.log('- Current Period Start:', (stripeSubscription as any).current_period_start)
      console.log('- Current Period End:', (stripeSubscription as any).current_period_end)
      console.log('- Cancel At Period End:', stripeSubscription.cancel_at_period_end)
      console.log('- Canceled At:', stripeSubscription.canceled_at)

      // Buscar usuário pelo customer ID
      const { data: profile } = await this.supabase
        .from('profiles')
        .select('id')
        .eq('stripe_customer_id', stripeSubscription.customer)
        .single()

      if (!profile) {
        console.error('Usuário não encontrado para customer:', stripeSubscription.customer)
        return null
      }

      console.log('Usuário encontrado:', profile.id)

      // Determinar tipo de plano
      const priceId = stripeSubscription.items.data[0]?.price?.id || ''
      const isPlus = this.isPlusPrice(priceId)
      const planType = this.getPlanType(priceId)

      console.log('Detecção de plano:')
      console.log('- Price ID:', priceId)
      console.log('- É Plus:', isPlus)
      console.log('- Plan Type:', planType)

      // Preparar dados da assinatura com validação de datas
      const subscriptionData: SubscriptionInsert = {
        user_id: profile.id,
        status: stripeSubscription.status as any,
        plan_type: planType,
        price_id: priceId,
        subscription_id: stripeSubscription.id,
        current_period_start: (stripeSubscription as any).current_period_start
          ? new Date((stripeSubscription as any).current_period_start * 1000).toISOString()
          : null,
        current_period_end: (stripeSubscription as any).current_period_end
          ? new Date((stripeSubscription as any).current_period_end * 1000).toISOString()
          : null,
        cancel_at_period_end: stripeSubscription.cancel_at_period_end || false,
        explicacao_pratica: isPlus,
        updated_at: new Date().toISOString(),
      }

      console.log('Dados para sincronização:')
      console.log('- Status:', subscriptionData.status)
      console.log('- Current Period Start:', subscriptionData.current_period_start)
      console.log('- Current Period End:', subscriptionData.current_period_end)
      console.log('- Cancel At Period End:', subscriptionData.cancel_at_period_end)
      console.log('- É Plus:', subscriptionData.explicacao_pratica)

      // Salvar no banco
      const result = await this.upsertSubscription(subscriptionData)

      if (result) {
        console.log('✅ Assinatura sincronizada com sucesso')
        console.log('ID:', result.id)
        console.log('Status final:', result.status)
        console.log('Período início:', result.current_period_start)
        console.log('Período fim:', result.current_period_end)
      } else {
        console.error('❌ Falha ao sincronizar assinatura')
      }

      return result
    } catch (error) {
      console.error('Erro no SubscriptionService.syncWithStripe:', error)
      return null
    }
  }

  // Cancelar assinatura
  async cancelSubscription(userId: string): Promise<boolean> {
    try {
      const subscription = await this.getSubscriptionByUserId(userId)

      if (!subscription || !subscription.subscription_id) {
        return false
      }

      // Cancelar no Stripe
      await stripe.subscriptions.update(subscription.subscription_id, {
        cancel_at_period_end: true,
      })

      // Atualizar no banco
      await this.supabase
        .from('subscriptions')
        .update({
          cancel_at_period_end: true,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)

      return true
    } catch (error) {
      console.error('Erro no SubscriptionService.cancelSubscription:', error)
      return false
    }
  }

  // Reativar assinatura
  async reactivateSubscription(userId: string): Promise<boolean> {
    try {
      const subscription = await this.getSubscriptionByUserId(userId)

      if (!subscription || !subscription.subscription_id) {
        return false
      }

      // Reativar no Stripe
      await stripe.subscriptions.update(subscription.subscription_id, {
        cancel_at_period_end: false,
      })

      // Atualizar no banco
      await this.supabase
        .from('subscriptions')
        .update({
          cancel_at_period_end: false,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)

      return true
    } catch (error) {
      console.error('Erro no SubscriptionService.reactivateSubscription:', error)
      return false
    }
  }

  // Métodos auxiliares
  private isPlusPrice(priceId: string): boolean {
    return (
      priceId.includes('plus') ||
      priceId.includes('Plus') ||
      priceId === 'price_1RQCodFLuMsSi0YiE0JiHq40'
    ) // Price ID específico do Plus
  }

  private getPlanType(priceId: string): 'monthly' | 'yearly' {
    // Verificar se é anual baseado no price ID ou no intervalo do Stripe
    return priceId.includes('yearly') || priceId.includes('anual') ? 'yearly' : 'monthly'
  }

  // Obter informações completas de acesso do usuário
  async getUserAccessInfo(userId: string): Promise<{
    hasActiveSubscription: boolean
    hasPlusSubscription: boolean
    subscription: Subscription | null
    accessLevel: 'none' | 'basic' | 'plus'
  }> {
    try {
      const subscription = await this.getSubscriptionByUserId(userId)
      const hasActiveSubscription = await this.hasActiveSubscription(userId)
      const hasPlusSubscription = await this.hasPlusSubscription(userId)

      let accessLevel: 'none' | 'basic' | 'plus' = 'none'
      if (hasActiveSubscription) {
        accessLevel = hasPlusSubscription ? 'plus' : 'basic'
      }

      return {
        hasActiveSubscription,
        hasPlusSubscription,
        subscription,
        accessLevel,
      }
    } catch (error) {
      console.error('Erro no SubscriptionService.getUserAccessInfo:', error)
      return {
        hasActiveSubscription: false,
        hasPlusSubscription: false,
        subscription: null,
        accessLevel: 'none',
      }
    }
  }
}

// Instância singleton do serviço
export const subscriptionService = new SubscriptionService()
