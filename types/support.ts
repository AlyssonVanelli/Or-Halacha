export type SupportRequestStatus = 'pending' | 'in_progress' | 'resolved' | 'closed'

export interface SupportRequest {
  id: string
  user_id: string
  email: string
  message: string
  status: SupportRequestStatus
  created_at: string
  updated_at: string
  resolved_at?: string
  response?: string
}

export interface SupportRequestCreate {
  message: string
}

export interface SupportRequestUpdate {
  status?: SupportRequestStatus
  response?: string
  resolved_at?: string
}

export interface SupportRequestResponse {
  success: boolean
  message?: string
  error?: string
  data?: SupportRequest
}
