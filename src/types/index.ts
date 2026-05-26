export type MemberStatus = 'active' | 'inactive' | 'suspended'
export type PlanStatus = 'active' | 'expired' | 'cancelled'
export type PaymentStatus = 'pending' | 'paid' | 'overdue' | 'cancelled'
export type AccessMethod = 'facial' | 'manual'

export interface Member {
  id: string
  name: string
  email: string | null
  cpf: string | null
  phone: string | null
  birth_date: string | null
  photo_url: string | null
  face_descriptor: number[] | null
  status: MemberStatus
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Plan {
  id: string
  name: string
  description: string | null
  duration_days: number
  price: number
  active: boolean
  created_at: string
}

export interface MemberPlan {
  id: string
  member_id: string
  plan_id: string
  start_date: string
  end_date: string
  status: PlanStatus
  created_at: string
  plan?: Plan
  member?: Member
}

export interface Payment {
  id: string
  member_id: string
  member_plan_id: string | null
  amount: number
  due_date: string
  paid_date: string | null
  status: PaymentStatus
  payment_method: string | null
  notes: string | null
  created_at: string
  member?: Member
  member_plan?: MemberPlan
}

export interface AccessLog {
  id: string
  member_id: string | null
  accessed_at: string
  method: AccessMethod
  allowed: boolean
  notes: string | null
  member?: Member
}
