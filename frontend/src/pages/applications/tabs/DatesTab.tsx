import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import api from '@/lib/api'
import type { DateType, ImportantDate } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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
import { formatDate } from '@/lib/utils'
import { toast } from 'sonner'

const DATE_TYPES: DateType[] = ['recruiter_call', 'interview', 'other']

const dateSchema = z.object({
  type: z.enum(['recruiter_call', 'interview', 'other'] as const),
  date: z.string().min(1, 'Date is required'),
  title: z.string().min(1, 'Title is required'),
  notes: z.string().optional(),
})

type DateFormValues = z.infer<typeof dateSchema>

interface DatesTabProps {
  applicationId: string
}

export function DatesTab({ applicationId }: DatesTabProps) {
  const qc = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingDate, setEditingDate] = useState<ImportantDate | null>(null)

  const { data: dates, isLoading } = useQuery<ImportantDate[]>({
    queryKey: ['application-dates', applicationId],
    queryFn: () => api.get(`/applications/${applicationId}/dates`).then((r) => r.data),
  })

  const form = useForm<DateFormValues>({
    resolver: zodResolver(dateSchema),
    defaultValues: { type: 'interview', date: '', title: '', notes: '' },
  })

  const openCreate = () => {
    setEditingDate(null)
    form.reset({ type: 'interview', date: '', title: '', notes: '' })
    setDialogOpen(true)
  }

  const openEdit = (d: ImportantDate) => {
    setEditingDate(d)
    form.reset({
      type: d.type as DateType,
      date: d.date.split('T')[0],
      title: d.title ?? '',
      notes: d.notes ?? '',
    })
    setDialogOpen(true)
  }

  const saveMutation = useMutation({
    mutationFn: (values: DateFormValues) => {
      const payload = {
        ...values,
        notes: values.notes || undefined,
      }
      if (editingDate) {
        return api
          .put(`/applications/${applicationId}/dates/${editingDate.id}`, payload)
          .then((r) => r.data)
      }
      return api.post(`/applications/${applicationId}/dates`, payload).then((r) => r.data)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['application-dates', applicationId] })
      setDialogOpen(false)
      toast.success(editingDate ? 'Date updated' : 'Date added')
    },
    onError: () => toast.error('Failed to save date'),
  })

  const deleteMutation = useMutation({
    mutationFn: (dateId: string) =>
      api.delete(`/applications/${applicationId}/dates/${dateId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['application-dates', applicationId] })
      toast.success('Date deleted')
    },
    onError: () => toast.error('Failed to delete date'),
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Important Dates</h3>
        <Button size="sm" onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Date
        </Button>
      </div>

      {isLoading ? (
        <div className="flex h-32 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : dates?.length === 0 ? (
        <p className="text-sm text-muted-foreground">No dates added yet.</p>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {dates?.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="capitalize text-sm">
                    {d.type.replace(/_/g, ' ')}
                  </TableCell>
                  <TableCell className="text-sm">{formatDate(d.date)}</TableCell>
                  <TableCell className="text-sm">{d.title ?? '—'}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{d.notes ?? '—'}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(d)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteMutation.mutate(d.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingDate ? 'Edit Date' : 'Add Important Date'}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((v) => saveMutation.mutate(v))}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {DATE_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t.replace(/_/g, ' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Technical Round 1" {...field} />
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
                      <Textarea rows={2} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
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
