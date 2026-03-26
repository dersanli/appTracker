import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import api from '@/lib/api'
import type { Recruiter } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { toast } from 'sonner'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

const recruiterSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  agency_name: z.string().optional(),
  notes: z.string().optional(),
})

type RecruiterFormValues = z.infer<typeof recruiterSchema>

export function RecruiterList() {
  useDocumentTitle('Recruiters')
  const qc = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRecruiter, setEditingRecruiter] = useState<Recruiter | null>(null)

  const { data, isLoading } = useQuery<Recruiter[]>({
    queryKey: ['recruiters'],
    queryFn: () => api.get('/recruiters').then((r) => r.data),
  })

  const form = useForm<RecruiterFormValues>({
    resolver: zodResolver(recruiterSchema),
    defaultValues: { name: '', email: '', phone: '', agency_name: '', notes: '' },
  })

  const openCreate = () => {
    setEditingRecruiter(null)
    form.reset({ name: '', email: '', phone: '', agency_name: '', notes: '' })
    setDialogOpen(true)
  }

  const openEdit = (r: Recruiter) => {
    setEditingRecruiter(r)
    form.reset({
      name: r.name,
      email: r.email ?? '',
      phone: r.phone ?? '',
      agency_name: r.agency_name ?? '',
      notes: r.notes ?? '',
    })
    setDialogOpen(true)
  }

  const saveMutation = useMutation({
    mutationFn: (values: RecruiterFormValues) => {
      const payload = {
        ...values,
        email: values.email || undefined,
        phone: values.phone || undefined,
        agency_name: values.agency_name || undefined,
        notes: values.notes || undefined,
      }
      if (editingRecruiter) {
        return api.put(`/recruiters/${editingRecruiter.id}`, payload).then((r) => r.data)
      }
      return api.post('/recruiters', payload).then((r) => r.data)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['recruiters'] })
      setDialogOpen(false)
      toast.success(editingRecruiter ? 'Recruiter updated' : 'Recruiter added')
    },
    onError: () => toast.error('Failed to save recruiter'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/recruiters/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['recruiters'] })
      toast.success('Recruiter deleted')
    },
    onError: () => toast.error('Failed to delete recruiter'),
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Recruiters</h2>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Recruiter
        </Button>
      </div>

      {/* Desktop table */}
      <div className="hidden rounded-md border md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Agency</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  Loading...
                </TableCell>
              </TableRow>
            ) : data?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No recruiters yet.
                </TableCell>
              </TableRow>
            ) : (
              data?.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <Link to={`/recruiters/${r.id}`} className="font-medium hover:underline">
                      {r.name}
                    </Link>
                  </TableCell>
                  <TableCell>{r.agency_name ?? '—'}</TableCell>
                  <TableCell>{r.email ?? '—'}</TableCell>
                  <TableCell>{r.phone ?? '—'}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(r)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteMutation.mutate(r.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile card list */}
      <div className="space-y-2 md:hidden">
        {isLoading ? (
          <p className="py-12 text-center text-muted-foreground">Loading...</p>
        ) : data?.length === 0 ? (
          <p className="py-12 text-center text-muted-foreground">No recruiters yet.</p>
        ) : (
          data?.map((r) => (
            <div key={r.id} className="flex items-center justify-between rounded-lg border bg-card p-4">
              <div className="min-w-0">
                <Link to={`/recruiters/${r.id}`} className="font-medium hover:underline">
                  {r.name}
                </Link>
                {r.agency_name && (
                  <p className="text-sm text-muted-foreground">{r.agency_name}</p>
                )}
                {r.email && (
                  <p className="text-sm text-muted-foreground">{r.email}</p>
                )}
              </div>
              <div className="flex shrink-0 gap-1">
                <Button variant="ghost" size="icon" onClick={() => openEdit(r)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(r.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingRecruiter ? 'Edit Recruiter' : 'Add Recruiter'}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((v) => saveMutation.mutate(v))} className="space-y-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Name *</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField control={form.control} name="agency_name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Agency</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl><Input type="email" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="phone" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="notes" render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl><Textarea rows={2} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
