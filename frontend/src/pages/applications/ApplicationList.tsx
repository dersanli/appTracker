import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import api from '@/lib/api'
import type {
  Application,
  ApplicationFilters,
  ApplicationStatus,
  JobType,
  WorkArrangement,
} from '@/types'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { StatusBadge } from '@/components/ui/status-badge'
import { formatDate } from '@/lib/utils'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

const STATUS_OPTIONS: { value: ApplicationStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All Statuses' },
  { value: 'applied', label: 'Applied' },
  { value: 'recruiter_chat', label: 'Recruiter Chat' },
  { value: 'interview', label: 'Interview' },
  { value: 'offer', label: 'Offer' },
  { value: 'offer_accepted', label: 'Offer Accepted' },
  { value: 'offer_rejected', label: 'Offer Rejected' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'withdrawn', label: 'Withdrawn' },
]

const JOB_TYPE_OPTIONS: { value: JobType | 'all'; label: string }[] = [
  { value: 'all', label: 'All Types' },
  { value: 'permanent', label: 'Permanent' },
  { value: 'contract', label: 'Contract' },
  { value: 'inside_ir35', label: 'Inside IR35' },
  { value: 'outside_ir35', label: 'Outside IR35' },
  { value: 'full_time', label: 'Full Time' },
  { value: 'part_time', label: 'Part Time' },
]

const WORK_OPTIONS: { value: WorkArrangement | 'all'; label: string }[] = [
  { value: 'all', label: 'All Arrangements' },
  { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hybrid' },
]

export function ApplicationList() {
  useDocumentTitle('Applications')
  const [filters, setFilters] = useState<ApplicationFilters>({})

  const queryParams = new URLSearchParams()
  if (filters.status) queryParams.set('status', filters.status)
  if (filters.job_type) queryParams.set('job_type', filters.job_type)
  if (filters.work_arrangement) queryParams.set('work_arrangement', filters.work_arrangement)
  if (filters.client_id) queryParams.set('client_id', filters.client_id)
  if (filters.recruiter_id) queryParams.set('recruiter_id', filters.recruiter_id)

  const { data, isLoading } = useQuery<Application[]>({
    queryKey: ['applications', filters],
    queryFn: () => {
      const qs = queryParams.toString()
      return api.get(`/applications${qs ? `?${qs}` : ''}`).then((r) => r.data)
    },
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Applications</h2>
        <Button asChild>
          <Link to="/applications/new">
            <Plus className="mr-2 h-4 w-4" />
            New Application
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select
          value={filters.status ?? 'all'}
          onValueChange={(v) =>
            setFilters((f) => ({
              ...f,
              status: v === 'all' ? undefined : (v as ApplicationStatus),
            }))
          }
        >
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.job_type ?? 'all'}
          onValueChange={(v) =>
            setFilters((f) => ({
              ...f,
              job_type: v === 'all' ? undefined : (v as JobType),
            }))
          }
        >
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {JOB_TYPE_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.work_arrangement ?? 'all'}
          onValueChange={(v) =>
            setFilters((f) => ({
              ...f,
              work_arrangement: v === 'all' ? undefined : (v as WorkArrangement),
            }))
          }
        >
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {WORK_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Arrangement</TableHead>
              <TableHead>Salary</TableHead>
              <TableHead>Applied</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  Loading...
                </TableCell>
              </TableRow>
            ) : data?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No applications found.
                </TableCell>
              </TableRow>
            ) : (
              data?.map((app) => (
                <TableRow key={app.id}>
                  <TableCell>
                    <Link
                      to={`/applications/${app.id}`}
                      className="font-medium hover:underline"
                    >
                      {app.role}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={app.current_status} />
                  </TableCell>
                  <TableCell className="capitalize">
                    {app.job_type ? app.job_type.replace(/_/g, ' ') : '—'}
                  </TableCell>
                  <TableCell className="capitalize">
                    {app.work_arrangement ?? '—'}
                  </TableCell>
                  <TableCell>
                    {app.salary_amount != null
                      ? `${app.salary_amount.toLocaleString()} (${app.salary_type ?? ''})`
                      : '—'}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDate(app.created_at)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
