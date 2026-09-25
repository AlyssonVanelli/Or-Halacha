import { createBillingPortalResponse } from '@/lib/billing-portal'

// O customerId enviado pelo frontend é ignorado: o portal abre para o usuário autenticado.
export async function POST() {
  return createBillingPortalResponse()
}
