import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Check, ChevronsUpDown, Plus } from 'lucide-react'
import api from '@/lib/api'
import type {
  Application,
  ApplicationStatus,
  Client,
  JobType,
  Recruiter,
  SalaryType,
  WorkArrangement,
} from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

// ── Quick-add recruiter modal ──────────────────────────────────────────────────

const quickRecruiterSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  agency_name: z.string().optional(),
})
type QuickRecruiterValues = z.infer<typeof quickRecruiterSchema>

function QuickAddRecruiterModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean
  onClose: () => void
  onCreated: (recruiter: Recruiter) => void
}) {
  const qc = useQueryClient()
  const form = useForm<QuickRecruiterValues>({
    resolver: zodResolver(quickRecruiterSchema),
    defaultValues: { name: '', email: '', phone: '', agency_name: '' },
  })

  const mutation = useMutation({
    mutationFn: (values: QuickRecruiterValues) =>
      api.post('/recruiters', {
        name: values.name,
        email: values.email || undefined,
        phone: values.phone || undefined,
        agency_name: values.agency_name || undefined,
      }).then((r) => r.data),
    onSuccess: (recruiter: Recruiter) => {
      qc.invalidateQueries({ queryKey: ['recruiters-all'] })
      toast.success('Recruiter added')
      form.reset()
      onCreated(recruiter)
    },
    onError: () => toast.error('Failed to add recruiter'),
  })

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { form.reset(); onClose() } }}>
      <DialogContent className="sm:max-w-md" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Add Recruiter</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} className="space-y-4 pt-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Name *</label>
            <Input placeholder="Jane Smith" {...form.register('name')} />
            {form.formState.errors.name && (
              <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Agency</label>
            <Input placeholder="Acme Recruitment" {...form.register('agency_name')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input type="email" placeholder="jane@acme.com" {...form.register('email')} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Phone</label>
              <Input placeholder="+44 7700 000000" {...form.register('phone')} />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => { form.reset(); onClose() }}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Adding...' : 'Add Recruiter'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ── Quick-add client modal ─────────────────────────────────────────────────────

const quickClientSchema = z.object({
  company_name: z.string().min(1, 'Company name is required'),
  contact_name: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
})
type QuickClientValues = z.infer<typeof quickClientSchema>

function QuickAddClientModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean
  onClose: () => void
  onCreated: (client: Client) => void
}) {
  const qc = useQueryClient()
  const form = useForm<QuickClientValues>({
    resolver: zodResolver(quickClientSchema),
    defaultValues: { company_name: '', contact_name: '', email: '', phone: '', website: '' },
  })

  const mutation = useMutation({
    mutationFn: (values: QuickClientValues) =>
      api.post('/clients', {
        company_name: values.company_name,
        contact_name: values.contact_name || undefined,
        email: values.email || undefined,
        phone: values.phone || undefined,
        website: values.website || undefined,
      }).then((r) => r.data),
    onSuccess: (client: Client) => {
      qc.invalidateQueries({ queryKey: ['clients-all'] })
      toast.success('Client added')
      form.reset()
      onCreated(client)
    },
    onError: () => toast.error('Failed to add client'),
  })

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { form.reset(); onClose() } }}>
      <DialogContent className="sm:max-w-md" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Add Client</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} className="space-y-4 pt-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Company Name *</label>
            <Input placeholder="Acme Corp" {...form.register('company_name')} />
            {form.formState.errors.company_name && (
              <p className="text-xs text-destructive">{form.formState.errors.company_name.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Contact Name</label>
            <Input placeholder="John Doe" {...form.register('contact_name')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input type="email" placeholder="john@acme.com" {...form.register('email')} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Phone</label>
              <Input placeholder="+44 7700 000000" {...form.register('phone')} />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Website</label>
            <Input placeholder="https://acme.com" {...form.register('website')} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => { form.reset(); onClose() }}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Adding...' : 'Add Client'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

const applicationSchema = z.object({
  role: z.string().min(1, 'Role is required'),
  job_description: z.string().optional(),
  job_type: z.enum([
    'contract', 'inside_ir35', 'outside_ir35', 'permanent', 'full_time', 'part_time',
  ] as const).nullable().optional(),
  work_arrangement: z.enum(['remote', 'hybrid'] as const).nullable().optional(),
  hybrid_days_per_week: z.string().optional(),
  salary_amount: z.string().optional(),
  salary_type: z.enum(['daily_rate', 'annual'] as const).nullable().optional(),
  current_status: z.enum([
    'applied', 'recruiter_chat', 'interview',
    'offer', 'offer_accepted', 'offer_rejected', 'rejected', 'withdrawn',
  ] as const),
  notes: z.string().optional(),
  recruiter_id: z.string().optional(),
  client_id: z.string().optional(),
})

type ApplicationFormValues = z.infer<typeof applicationSchema>

const defaultValues: ApplicationFormValues = {
  role: '',
  job_description: '',
  job_type: 'permanent',
  work_arrangement: 'hybrid',
  hybrid_days_per_week: '',
  salary_amount: '',
  salary_type: 'annual',
  current_status: 'applied',
  notes: '',
  recruiter_id: '',
  client_id: '',
}

// Standalone combobox components to avoid Form generic inference issues
interface RecruiterComboboxProps {
  value: string
  onChange: (val: string) => void
  recruiters: Recruiter[] | undefined
  onAddNew: () => void
}

function RecruiterCombobox({ value, onChange, recruiters, onAddNew }: RecruiterComboboxProps) {
  const [open, setOpen] = useState(false)
  const selected = recruiters?.find((r) => r.id === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          className={cn('w-full justify-between', !value && 'text-muted-foreground')}
        >
          {selected
            ? `${selected.name}${selected.agency_name ? ` (${selected.agency_name})` : ''}`
            : 'Select recruiter'}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder="Search recruiters..." />
          <CommandList>
            <CommandEmpty>No recruiter found.</CommandEmpty>
            <CommandGroup>
              <CommandItem value="__none__" onSelect={() => { onChange(''); setOpen(false) }}>
                <Check className={cn('mr-2 h-4 w-4', !value ? 'opacity-100' : 'opacity-0')} />
                None
              </CommandItem>
              {recruiters?.map((r) => (
                <CommandItem key={r.id} value={r.name} onSelect={() => { onChange(r.id); setOpen(false) }}>
                  <Check className={cn('mr-2 h-4 w-4', value === r.id ? 'opacity-100' : 'opacity-0')} />
                  {r.name}{r.agency_name ? ` (${r.agency_name})` : ''}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
        <div className="border-t p-1">
          <button
            type="button"
            onClick={() => { setOpen(false); onAddNew() }}
            className="flex w-full items-center rounded-sm px-2 py-1.5 text-sm text-primary hover:bg-accent"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add New Recruiter
          </button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

interface ClientComboboxProps {
  value: string
  onChange: (val: string) => void
  clients: Client[] | undefined
  onAddNew: () => void
}

function ClientCombobox({ value, onChange, clients, onAddNew }: ClientComboboxProps) {
  const [open, setOpen] = useState(false)
  const selected = clients?.find((c) => c.id === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          className={cn('w-full justify-between', !value && 'text-muted-foreground')}
        >
          {selected ? selected.company_name : 'Select client'}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder="Search clients..." />
          <CommandList>
            <CommandEmpty>No client found.</CommandEmpty>
            <CommandGroup>
              <CommandItem value="__none__" onSelect={() => { onChange(''); setOpen(false) }}>
                <Check className={cn('mr-2 h-4 w-4', !value ? 'opacity-100' : 'opacity-0')} />
                None
              </CommandItem>
              {clients?.map((c) => (
                <CommandItem key={c.id} value={c.company_name} onSelect={() => { onChange(c.id); setOpen(false) }}>
                  <Check className={cn('mr-2 h-4 w-4', value === c.id ? 'opacity-100' : 'opacity-0')} />
                  {c.company_name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
        <div className="border-t p-1">
          <button
            type="button"
            onClick={() => { setOpen(false); onAddNew() }}
            className="flex w-full items-center rounded-sm px-2 py-1.5 text-sm text-primary hover:bg-accent"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add New Client
          </button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export function ApplicationForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [recruiterModalOpen, setRecruiterModalOpen] = useState(false)
  const [clientModalOpen, setClientModalOpen] = useState(false)

  const { data: existing } = useQuery<Application>({
    queryKey: ['application', id],
    queryFn: () => api.get(`/applications/${id}`).then((r) => r.data),
    enabled: isEdit,
  })

  const { data: recruiters } = useQuery<Recruiter[]>({
    queryKey: ['recruiters-all'],
    queryFn: () => api.get('/recruiters').then((r) => r.data),
  })

  const { data: clients } = useQuery<Client[]>({
    queryKey: ['clients-all'],
    queryFn: () => api.get('/clients').then((r) => r.data),
  })

  const form = useForm<ApplicationFormValues>({
    resolver: zodResolver(applicationSchema),
    defaultValues,
  })

  useEffect(() => {
    if (existing) {
      form.reset({
        role: existing.role,
        job_description: existing.job_description ?? '',
        job_type: existing.job_type as JobType | null | undefined,
        work_arrangement: existing.work_arrangement as WorkArrangement | null | undefined,
        hybrid_days_per_week: existing.hybrid_days_per_week != null
          ? String(existing.hybrid_days_per_week)
          : '',
        salary_amount: existing.salary_amount != null ? String(existing.salary_amount) : '',
        salary_type: existing.salary_type as SalaryType | null | undefined,
        current_status: existing.current_status as ApplicationStatus,
        notes: existing.notes ?? '',
        recruiter_id: existing.recruiter_id ?? '',
        client_id: existing.client_id ?? '',
      })
    }
  }, [existing, form])

  const mutation = useMutation({
    mutationFn: (values: ApplicationFormValues) => {
      const payload = {
        role: values.role,
        job_description: values.job_description || undefined,
        job_type: values.job_type || undefined,
        work_arrangement: values.work_arrangement || undefined,
        hybrid_days_per_week: values.hybrid_days_per_week
          ? Number(values.hybrid_days_per_week)
          : undefined,
        salary_amount: values.salary_amount ? Number(values.salary_amount) : undefined,
        salary_type: values.salary_type || undefined,
        current_status: values.current_status,
        notes: values.notes || undefined,
        recruiter_id: values.recruiter_id || undefined,
        client_id: values.client_id || undefined,
      }
      if (isEdit) {
        return api.put(`/applications/${id}`, payload).then((r) => r.data)
      }
      return api.post('/applications', payload).then((r) => r.data)
    },
    onSuccess: (data: Application) => {
      qc.invalidateQueries({ queryKey: ['applications'] })
      qc.invalidateQueries({ queryKey: ['application', id] })
      toast.success(isEdit ? 'Application updated' : 'Application created')
      navigate(`/applications/${data.id}`)
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : 'Failed to save'
      toast.error(message)
    },
  })

  const recruiterIdValue = form.watch('recruiter_id') ?? ''
  const clientIdValue = form.watch('client_id') ?? ''
  const workArrangement = form.watch('work_arrangement')
  const jobType = form.watch('job_type')
  const isContract = jobType === 'inside_ir35' || jobType === 'outside_ir35'

  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>{isEdit ? 'Edit Application' : 'New Application'}</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} className="space-y-6">
              {/* Role */}
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role *</FormLabel>
                    <FormControl>
                      <Input placeholder="Software Engineer" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="job_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Type</FormLabel>
                      <Select
                        value={field.value ?? ''}
                        onValueChange={(v) => {
                          field.onChange(v || null)
                          if (v === 'inside_ir35' || v === 'outside_ir35') {
                            form.setValue('salary_type', 'daily_rate')
                          } else if (v === 'permanent') {
                            form.setValue('salary_type', 'annual')
                          }
                        }}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="permanent">Permanent</SelectItem>
                          <SelectItem value="inside_ir35">Contract Inside IR35</SelectItem>
                          <SelectItem value="outside_ir35">Contract Outside IR35</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="work_arrangement"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Work Arrangement</FormLabel>
                      <Select
                        value={field.value ?? ''}
                        onValueChange={(v) => {
                          field.onChange(v || null)
                          if (v === 'remote') form.setValue('hybrid_days_per_week', '0')
                        }}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select arrangement" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="remote">Remote</SelectItem>
                          <SelectItem value="hybrid">Hybrid</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="current_status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="applied">Applied</SelectItem>
                          <SelectItem value="recruiter_chat">Recruiter Chat</SelectItem>
                          <SelectItem value="interview">Interview</SelectItem>
                          <SelectItem value="offer">Offer</SelectItem>
                          <SelectItem value="offer_accepted">Offer Accepted</SelectItem>
                          <SelectItem value="offer_rejected">Offer Rejected</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                          <SelectItem value="withdrawn">Withdrawn</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Hybrid days */}
              {workArrangement === 'hybrid' && (
                <FormField
                  control={form.control}
                  name="hybrid_days_per_week"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hybrid Days Per Week</FormLabel>
                      <FormControl>
                        <Input type="number" min={1} max={7} placeholder="e.g. 2" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Salary */}
              <FormField
                control={form.control}
                name="salary_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isContract ? 'Daily Rate (£)' : 'Annual Salary (£)'}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder={isContract ? 'e.g. 500' : 'e.g. 60000'}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Recruiter */}
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none">Recruiter</label>
                <RecruiterCombobox
                  value={recruiterIdValue}
                  onChange={(v) => form.setValue('recruiter_id', v)}
                  recruiters={recruiters}
                  onAddNew={() => setRecruiterModalOpen(true)}
                />
              </div>

              {/* Client */}
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none">Client</label>
                <ClientCombobox
                  value={clientIdValue}
                  onChange={(v) => form.setValue('client_id', v)}
                  clients={clients}
                  onAddNew={() => setClientModalOpen(true)}
                />
              </div>

              <FormField
                control={form.control}
                name="job_description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Paste the job description..." rows={5} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Any notes..." rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(-1)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending ? 'Saving...' : isEdit ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <QuickAddRecruiterModal
        open={recruiterModalOpen}
        onClose={() => setRecruiterModalOpen(false)}
        onCreated={(recruiter) => {
          setRecruiterModalOpen(false)
          form.setValue('recruiter_id', recruiter.id)
        }}
      />

      <QuickAddClientModal
        open={clientModalOpen}
        onClose={() => setClientModalOpen(false)}
        onCreated={(client) => {
          setClientModalOpen(false)
          form.setValue('client_id', client.id)
        }}
      />
    </div>
  )
}
