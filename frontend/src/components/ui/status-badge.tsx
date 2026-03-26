import { Badge } from '@/components/ui/badge'
import type { ApplicationStatus } from '@/types'
import { cn } from '@/lib/utils'

const statusConfig: Record<
  ApplicationStatus,
  { label: string; short: string; className: string }
> = {
  applied:        { label: 'Applied',        short: 'AP', className: 'bg-blue-100 text-blue-700 border-blue-200' },
  recruiter_chat: { label: 'Recruiter Chat', short: 'RC', className: 'bg-purple-100 text-purple-700 border-purple-200' },
  interview:      { label: 'Interview',      short: 'IV', className: 'bg-amber-100 text-amber-700 border-amber-200' },
  offer:          { label: 'Offer',          short: 'OF', className: 'bg-green-100 text-green-700 border-green-200' },
  offer_accepted: { label: 'Offer Accepted', short: 'OA', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  offer_rejected: { label: 'Offer Rejected', short: 'OR', className: 'bg-orange-100 text-orange-700 border-orange-200' },
  rejected:       { label: 'Rejected',       short: 'RJ', className: 'bg-red-100 text-red-700 border-red-200' },
  withdrawn:      { label: 'Withdrawn',      short: 'WD', className: 'bg-gray-100 text-gray-700 border-gray-200' },
}

interface StatusBadgeProps {
  status: ApplicationStatus
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] ?? { label: status, short: status.slice(0, 2).toUpperCase(), className: '' }
  return (
    <Badge variant="outline" className={cn(config.className, 'whitespace-nowrap', className)}>
      <span className="sm:hidden">{config.short}</span>
      <span className="hidden sm:inline">{config.label}</span>
    </Badge>
  )
}

export { statusConfig }
