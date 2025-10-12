import { subscriptionService } from './subscription-service'
import { purchaseService } from './purchase-service'

export interface AccessInfo {
  hasAccess: boolean
  accessType: 'subscription' | 'purchase' | 'none'
  subscriptionInfo?: {
    isActive: boolean
    isPlus: boolean
    planType: 'monthly' | 'yearly'
    status: string
  }
  purchaseInfo?: {
    hasActivePurchases: boolean
    purchasedDivisions: string[]
  }
  canAccessDivision: (divisionId: string) => boolean
  canAccessBook: (bookId: string) => boolean
}

export class AccessService {
  // Verificar acesso geral do usuário
  async getUserAccess(userId: string): Promise<AccessInfo> {
    try {
      // Verificar assinatura
      const subscriptionInfo = await subscriptionService.getUserAccessInfo(userId)

      // Se tem assinatura ativa, retorna acesso completo
      if (subscriptionInfo.hasActiveSubscription) {
        return {
          hasAccess: true,
          accessType: 'subscription',
          subscriptionInfo: {
            isActive: subscriptionInfo.hasActiveSubscription,
            isPlus: subscriptionInfo.hasPlusSubscription,
            planType: subscriptionInfo.subscription?.plan_type || 'monthly',
            status: subscriptionInfo.subscription?.status || 'unknown',
          },
          canAccessDivision: () => true, // Assinatura dá acesso a tudo
          canAccessBook: () => true, // Assinatura dá acesso a tudo
        }
      }

      // Verificar compras
      const purchaseInfo = await purchaseService.hasAnyAccess(userId)

      if (purchaseInfo.hasAccess && purchaseInfo.accessType === 'purchase') {
        const purchasedDivisions = purchaseInfo.details.purchasedDivisions || []

        return {
          hasAccess: true,
          accessType: 'purchase',
          purchaseInfo: {
            hasActivePurchases: true,
            purchasedDivisions,
          },
          canAccessDivision: (divisionId: string) => purchasedDivisions.includes(divisionId),
          canAccessBook: (bookId: string) => {
            // Para compras, verificar se tem pelo menos uma divisão do livro
            return purchasedDivisions.length > 0
          },
        }
      }

      // Sem acesso
      return {
        hasAccess: false,
        accessType: 'none',
        canAccessDivision: () => false,
        canAccessBook: () => false,
      }
    } catch (error) {
      console.error('Erro no AccessService.getUserAccess:', error)
      return {
        hasAccess: false,
        accessType: 'none',
        canAccessDivision: () => false,
        canAccessBook: () => false,
      }
    }
  }

  // Verificar acesso específico a uma divisão
  async canAccessDivision(userId: string, divisionId: string): Promise<boolean> {
    try {
      const accessInfo = await this.getUserAccess(userId)

      if (accessInfo.accessType === 'subscription') {
        return true // Assinatura dá acesso a tudo
      }

      if (accessInfo.accessType === 'purchase') {
        return accessInfo.canAccessDivision(divisionId)
      }

      return false
    } catch (error) {
      console.error('Erro no AccessService.canAccessDivision:', error)
      return false
    }
  }

  // Verificar acesso específico a um livro
  async canAccessBook(userId: string, bookId: string): Promise<boolean> {
    try {
      const accessInfo = await this.getUserAccess(userId)

      if (accessInfo.accessType === 'subscription') {
        return true // Assinatura dá acesso a tudo
      }

      if (accessInfo.accessType === 'purchase') {
        return accessInfo.canAccessBook(bookId)
      }

      return false
    } catch (error) {
      console.error('Erro no AccessService.canAccessBook:', error)
      return false
    }
  }

  // Verificar se usuário tem acesso Plus
  async hasPlusAccess(userId: string): Promise<boolean> {
    try {
      const subscriptionInfo = await subscriptionService.getUserAccessInfo(userId)
      return subscriptionInfo.hasPlusSubscription
    } catch (error) {
      console.error('Erro no AccessService.hasPlusAccess:', error)
      return false
    }
  }

  // Obter informações detalhadas de acesso
  async getDetailedAccessInfo(userId: string): Promise<{
    access: AccessInfo
    subscriptionDetails?: any
    purchaseDetails?: any
  }> {
    try {
      const access = await this.getUserAccess(userId)

      let subscriptionDetails: any = null
      let purchaseDetails: any = null

      if (access.accessType === 'subscription') {
        subscriptionDetails = await subscriptionService.getSubscriptionByUserId(userId)
      }

      if (access.accessType === 'purchase') {
        purchaseDetails = await purchaseService.getActivePurchases(userId)
      }

      return {
        access,
        subscriptionDetails,
        purchaseDetails,
      }
    } catch (error) {
      console.error('Erro no AccessService.getDetailedAccessInfo:', error)
      return {
        access: {
          hasAccess: false,
          accessType: 'none',
          canAccessDivision: () => false,
          canAccessBook: () => false,
        },
      }
    }
  }
}

// Instância singleton do serviço
export const accessService = new AccessService()
