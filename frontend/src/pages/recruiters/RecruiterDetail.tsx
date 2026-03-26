import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Trash2 } from 'lucide-react'
import api from '@/lib/api'
import type { Recruiter } from '@/types'
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

export function RecruiterDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { data: recruiter, isLoading } = useQuery<Recruiter>({
    queryKey: ['recruiter', id],
    queryFn: () => api.get(`/recruiters/${id}`).then((r) => r.data),
    enabled: Boolean(id),
  })

  useDocumentTitle(recruiter?.name ?? 'Recruiter')

  const form = useForm<RecruiterFormValues>({
    resolver: zodResolver(recruiterSchema),
    values: recruiter
      ? {
          name: recruiter.name,
          email: recruiter.email ?? '',
          phone: recruiter.phone ?? '',
          agency_name: recruiter.agency_name ?? '',
          notes: recruiter.notes ?? '',
        }
      : undefined,
  })

  const updateMutation = useMutation({
    mutationFn: (values: RecruiterFormValues) => {
      const payload = {
        ...values,
        email: values.email || undefined,
        phone: values.phone || undefined,
        agency_name: values.agency_name || undefined,
        notes: values.notes || undefined,
      }
      return api.put(`/recruiters/${id}`, payload).then((r) => r.data)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['recruiters'] })
      qc.invalidateQueries({ queryKey: ['recruiter', id] })
      toast.success('Recruiter updated')
    },
    onError: () => toast.error('Failed to update recruiter'),
  })

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/recruiters/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['recruiters'] })
      toast.success('Recruiter deleted')
      navigate('/recruiters')
    },
    onError: () => toast.error('Failed to delete recruiter'),
  })

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!recruiter) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        Recruiter not found.
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Link to="/recruiters" className="text-sm text-muted-foreground hover:underline">
            ← Recruiters
          </Link>
          <h2 className="text-2xl font-bold mt-1">{recruiter.name}</h2>
          {recruiter.agency_name && (
            <p className="text-muted-foreground">{recruiter.agency_name}</p>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => deleteMutation.mutate()}
          disabled={deleteMutation.isPending}
        >
          <Trash2 className="mr-2 h-4 w-4 text-destructive" />
          Delete
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((v) => updateMutation.mutate(v))}
              className="space-y-4"
            >
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Name *</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
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
                  <FormControl><Textarea rows={3} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="flex justify-end">
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
