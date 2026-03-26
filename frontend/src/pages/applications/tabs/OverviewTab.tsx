import type { Application } from '@/types'
import { StatusBadge } from '@/components/ui/status-badge'
import { formatDate } from '@/lib/utils'

interface OverviewTabProps {
  application: Application
}

export function OverviewTab({ application }: OverviewTabProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
        <Field label="Role" value={application.role} />
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">Status</p>
          <StatusBadge status={application.current_status} />
        </div>
        <Field
          label="Job Type"
          value={application.job_type ? application.job_type.replace(/_/g, ' ') : undefined}
          capitalize
        />
        <Field
          label="Work Arrangement"
          value={application.work_arrangement ?? undefined}
          capitalize
        />
        {application.work_arrangement === 'hybrid' && (
          <Field
            label="Hybrid Days/Week"
            value={application.hybrid_days_per_week != null
              ? String(application.hybrid_days_per_week)
              : undefined}
          />
        )}
        <Field
          label="Salary"
          value={
            application.salary_amount != null
              ? `${application.salary_amount.toLocaleString()} (${application.salary_type ?? ''})`
              : undefined
          }
        />
        <Field label="Applied" value={formatDate(application.created_at)} />
        {application.recruiter && (
          <Field
            label="Recruiter"
            value={`${application.recruiter.name}${application.recruiter.agency_name ? ` (${application.recruiter.agency_name})` : ''}`}
          />
        )}
        {application.client && (
          <Field label="Client" value={application.client.company_name} />
        )}
      </div>

      {application.notes && (
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">Notes</p>
          <p className="text-sm whitespace-pre-wrap">{application.notes}</p>
        </div>
      )}

      {application.job_description && (
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">Job Description</p>
          <p className="text-sm whitespace-pre-wrap text-muted-foreground">{application.job_description}</p>
        </div>
      )}
    </div>
  )
}

function Field({
  label,
  value,
  capitalize,
}: {
  label: string
  value?: string | null
  capitalize?: boolean
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">{label}</p>
      <p className={`text-sm ${capitalize ? 'capitalize' : ''}`}>{value ?? '—'}</p>
    </div>
  )
}
