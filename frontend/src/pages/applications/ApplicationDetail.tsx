import { useQuery } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import { Pencil, LayoutDashboard, FileText, BookOpen, CalendarDays, History } from 'lucide-react'
import api from '@/lib/api'
import type { Application } from '@/types'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { StatusBadge } from '@/components/ui/status-badge'
import { OverviewTab } from './tabs/OverviewTab'
import { CVTab } from './tabs/CVTab'
import { PrepNotesTab } from './tabs/PrepNotesTab'
import { DatesTab } from './tabs/DatesTab'
import { StatusHistoryTab } from './tabs/StatusHistoryTab'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

export function ApplicationDetail() {
  const { id } = useParams<{ id: string }>()

  const { data: application, isLoading, error } = useQuery<Application>({
    queryKey: ['application', id],
    queryFn: () => api.get(`/applications/${id}`).then((r) => r.data),
    enabled: Boolean(id),
  })

  useDocumentTitle(application?.role ?? 'Application Details')

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (error || !application) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        Application not found.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold">{application.role}</h2>
          {(application.client || application.recruiter) && (
            <p className="text-muted-foreground">
              {[application.client?.company_name, application.recruiter?.name].filter(Boolean).join(' — ')}
            </p>
          )}
          <div className="mt-2">
            <StatusBadge status={application.current_status} />
          </div>
        </div>
        <Button variant="outline" asChild>
          <Link to={`/applications/${id}/edit`}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Link>
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="overview"><LayoutDashboard className="mr-2 h-4 w-4" />Overview</TabsTrigger>
          <TabsTrigger value="cv"><FileText className="mr-2 h-4 w-4" />CV</TabsTrigger>
          <TabsTrigger value="prep-notes"><BookOpen className="mr-2 h-4 w-4" />Prep Notes</TabsTrigger>
          <TabsTrigger value="dates"><CalendarDays className="mr-2 h-4 w-4" />Dates</TabsTrigger>
          <TabsTrigger value="status-history"><History className="mr-2 h-4 w-4" />Status History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <OverviewTab application={application} />
        </TabsContent>

        <TabsContent value="cv" className="mt-4">
          <CVTab applicationId={application.id} />
        </TabsContent>

        <TabsContent value="prep-notes" className="mt-4">
          <PrepNotesTab applicationId={application.id} />
        </TabsContent>

        <TabsContent value="dates" className="mt-4">
          <DatesTab applicationId={application.id} />
        </TabsContent>

        <TabsContent value="status-history" className="mt-4">
          <StatusHistoryTab applicationId={application.id} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
