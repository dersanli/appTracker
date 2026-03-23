import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { formatDistanceToNow } from 'date-fns'
import api from '@/lib/api'
import type { StatusHistory } from '@/types'
import { Button } from '@/components/ui/button'
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/status-badge'
import { toast } from 'sonner'

const statusSchema = z.object({
  status: z.enum([
    'applied', 'recruiter_chat', 'interview',
    'offer', 'offer_accepted', 'offer_rejected', 'rejected', 'withdrawn',
  ] as const),
  notes: z.string().optional(),
})

type StatusFormValues = z.infer<typeof statusSchema>

interface StatusHistoryTabProps {
  applicationId: string
}

export function StatusHistoryTab({ applicationId }: StatusHistoryTabProps) {
  const qc = useQueryClient()

  const { data: history, isLoading } = useQuery<StatusHistory[]>({
    queryKey: ['application-status-history', applicationId],
    queryFn: () =>
      api.get(`/applications/${applicationId}/status-history`).then((r) => r.data),
  })

  const form = useForm<StatusFormValues>({
    resolver: zodResolver(statusSchema),
    defaultValues: { status: 'applied', notes: '' },
  })

  const mutation = useMutation({
    mutationFn: (values: StatusFormValues) =>
      api
        .post(`/applications/${applicationId}/status-history`, {
          ...values,
          notes: values.notes || undefined,
        })
        .then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['application-status-history', applicationId] })
      qc.invalidateQueries({ queryKey: ['application', applicationId] })
      form.reset()
      toast.success('Status updated')
    },
    onError: () => toast.error('Failed to update status'),
  })

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Timeline */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold">History</h3>
        {isLoading ? (
          <div className="flex h-32 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : history?.length === 0 ? (
          <p className="text-sm text-muted-foreground">No status history yet.</p>
        ) : (
          <ol className="relative border-l border-muted ml-3">
            {history?.map((item) => (
              <li key={item.id} className="mb-6 ml-6">
                <span className="absolute -left-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-background border-2 border-primary" />
                <div className="flex items-center gap-2 mb-1">
                  <StatusBadge status={item.status} />
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(item.changed_at), { addSuffix: true })}
                  </span>
                </div>
                {item.notes && (
                  <p className="text-sm text-muted-foreground">{item.notes}</p>
                )}
              </li>
            ))}
          </ol>
        )}
      </div>

      {/* Add new status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Update Status</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Status</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {[
                          'applied', 'recruiter_chat', 'interview',
                          'offer', 'offer_accepted', 'offer_rejected', 'rejected', 'withdrawn',
                        ].map((s) => (
                          <SelectItem key={s} value={s}>
                            {s.replace(/_/g, ' ')}
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
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Optional notes..." rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? 'Updating...' : 'Update Status'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
