// ─── Enums ────────────────────────────────────────────────────────────────────

export type JobType =
  | 'permanent'
  | 'inside_ir35'
  | 'outside_ir35'

export type WorkArrangement = 'remote' | 'hybrid'

export type SalaryType = 'daily_rate' | 'annual'

export type ApplicationStatus =
  | 'applied'
  | 'recruiter_chat'
  | 'interview'
  | 'offer'
  | 'offer_accepted'
  | 'offer_rejected'
  | 'rejected'
  | 'withdrawn'

export type DateType = 'recruiter_call' | 'interview' | 'other'

// ─── Core Entities ────────────────────────────────────────────────────────────

export interface Recruiter {
  id: string
  user_id: string
  name: string
  email: string | null
  phone: string | null
  agency_name: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Client {
  id: string
  user_id: string
  company_name: string
  contact_name: string | null
  email: string | null
  phone: string | null
  website: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Application {
  id: string
  user_id: string
  role: string
  job_description: string | null
  client_id: string | null
  recruiter_id: string | null
  job_type: JobType | null
  work_arrangement: WorkArrangement | null
  hybrid_days_per_week: number | null
  salary_type: SalaryType | null
  salary_amount: number | null
  current_status: ApplicationStatus
  notes: string | null
  recruiter?: Recruiter | null
  client?: Client | null
  created_at: string
  updated_at: string
}

export interface StatusHistory {
  id: string
  application_id: string
  status: ApplicationStatus
  notes: string | null
  changed_at: string
}

export interface ImportantDate {
  id: string
  application_id: string
  status_history_id: string | null
  title: string
  date: string
  type: DateType
  notes: string | null
  created_at: string
}

export interface CVLibraryItem {
  id: string
  user_id: string
  name: string
  content: string
  created_at: string
  updated_at: string
}

export interface ApplicationCV {
  id: string
  application_id: string
  name: string
  content: string
  source_cv_id: string | null
  created_at: string
  updated_at: string
}

export interface PrepNoteLibraryItem {
  id: string
  user_id: string
  name: string
  content: string
  created_at: string
  updated_at: string
}

export interface ApplicationPrepNote {
  id: string
  application_id: string
  name: string
  content: string
  source_note_id: string | null
  created_at: string
  updated_at: string
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export interface StatusBreakdown {
  status: ApplicationStatus
  count: number
}

export interface UpcomingDate {
  id: string
  application_id: string
  application_role: string
  title: string | null
  date: string
  type: DateType
  notes: string | null
}

export interface RecentActivity {
  id: string
  application_id: string
  application_role: string
  status: ApplicationStatus
  notes: string | null
  changed_at: string
}

export interface DashboardData {
  total_applications: number
  status_breakdown: StatusBreakdown[]
  upcoming_dates: UpcomingDate[]
  recent_activity: RecentActivity[]
}

// ─── API Request/Response types ───────────────────────────────────────────────

export interface ApplicationFilters {
  status?: ApplicationStatus
  job_type?: JobType
  work_arrangement?: WorkArrangement
  client_id?: string
  recruiter_id?: string
}
