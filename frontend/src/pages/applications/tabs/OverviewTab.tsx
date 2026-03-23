import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Pencil } from 'lucide-react'
import type { Application } from '@/types'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { StatusBadge } from '@/components/ui/status-badge'
import { formatDate } from '@/lib/utils'
import { toast } from 'sonner'

const overviewSchema = z.object({
  role: z.string().min(1),
  job_type: z.string().optional(),
  work_arrangement: z.string().optional(),
  hybrid_days_per_week: z.string().optional(),
  salary_amount: z.string().optional(),
  salary_type: z.string().optional(),
  current_status: z.string(),
  notes: z.string().optional(),
  job_description: z.string().optional(),
})

type OverviewFormValues = z.infer<typeof overviewSchema>

interface OverviewTabProps {
  application: Application
}

export function OverviewTab({ application }: OverviewTabProps) {
  const [editing, setEditing] = useState(false)
  const qc = useQueryClient()

  const form = useForm<OverviewFormValues>({
    resolver: zodResolver(overviewSchema),
    defaultValues: {
      role: application.role,
      job_type: application.job_type ?? '',
      work_arrangement: application.work_arrangement ?? '',
      hybrid_days_per_week: application.hybrid_days_per_week != null
        ? String(application.hybrid_days_per_week)
        : '',
      salary_amount: application.salary_amount != null ? String(application.salary_amount) : '',
      salary_type: application.salary_type ?? '',
      current_status: application.current_status,
      notes: application.notes ?? '',
      job_description: application.job_description ?? '',
    },
  })

  const mutation = useMutation({
    mutationFn: (values: OverviewFormValues) => {
      const payload = {
        role: values.role,
        job_type: values.job_type || undefined,
        work_arrangement: values.work_arrangement || undefined,
        hybrid_days_per_week: values.hybrid_days_per_week
          ? Number(values.hybrid_days_per_week)
          : undefined,
        salary_amount: values.salary_amount ? Number(values.salary_amount) : undefined,
        salary_type: values.salary_type || undefined,
        current_status: values.current_status,
        notes: values.notes || undefined,
        job_description: values.job_description || undefined,
      }
      return api.put(`/applications/${application.id}`, payload).then((r) => r.data)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['application', application.id] })
      toast.success('Application updated')
      setEditing(false)
    },
    onError: () => toast.error('Failed to update'),
  })

  if (!editing) {
    return (
      <div className="space-y-6">
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="role" render={({ field }) => (
            <FormItem>
              <FormLabel>Role</FormLabel>
              <FormControl><Input {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="current_status" render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                <SelectContent>
                  {[
                    'applied', 'recruiter_chat', 'interview',
                    'offer', 'offer_accepted', 'offer_rejected', 'rejected', 'withdrawn',
                  ].map(s => (
                    <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="job_type" render={({ field }) => (
            <FormItem>
              <FormLabel>Job Type</FormLabel>
              <Select value={field.value ?? ''} onValueChange={field.onChange}>
                <FormControl><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger></FormControl>
                <SelectContent>
                  {[
                    'permanent', 'contract', 'inside_ir35', 'outside_ir35', 'full_time', 'part_time',
                  ].map(s => (
                    <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="work_arrangement" render={({ field }) => (
            <FormItem>
              <FormLabel>Work Arrangement</FormLabel>
              <Select value={field.value ?? ''} onValueChange={field.onChange}>
                <FormControl><SelectTrigger><SelectValue placeholder="Select arrangement" /></SelectTrigger></FormControl>
                <SelectContent>
                  <SelectItem value="remote">Remote</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="hybrid_days_per_week" render={({ field }) => (
            <FormItem>
              <FormLabel>Hybrid Days/Week</FormLabel>
              <FormControl><Input type="number" min={0} max={7} {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="salary_amount" render={({ field }) => (
            <FormItem>
              <FormLabel>Salary Amount</FormLabel>
              <FormControl><Input type="number" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="salary_type" render={({ field }) => (
            <FormItem>
              <FormLabel>Salary Type</FormLabel>
              <Select value={field.value ?? ''} onValueChange={field.onChange}>
                <FormControl><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger></FormControl>
                <SelectContent>
                  <SelectItem value="annual">Annual</SelectItem>
                  <SelectItem value="daily_rate">Daily Rate</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <FormField control={form.control} name="notes" render={({ field }) => (
          <FormItem>
            <FormLabel>Notes</FormLabel>
            <FormControl><Textarea rows={3} {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="job_description" render={({ field }) => (
          <FormItem>
            <FormLabel>Job Description</FormLabel>
            <FormControl><Textarea rows={5} {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Form>
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
