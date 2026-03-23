import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import MDEditor from '@uiw/react-md-editor'
import api from '@/lib/api'
import type { ApplicationCV } from '@/types'
import { Button } from '@/components/ui/button'
import { Save, Download } from 'lucide-react'
import { toast } from 'sonner'

interface CVTabProps {
  applicationId: string
}

export function CVTab({ applicationId }: CVTabProps) {
  const qc = useQueryClient()

  const { data: cv, isLoading } = useQuery<ApplicationCV | null>({
    queryKey: ['application-cv', applicationId],
    queryFn: () =>
      api
        .get(`/applications/${applicationId}/cv`)
        .then((r) => r.data)
        .catch((err) => {
          if (err.response?.status === 404) return null
          throw err
        }),
  })

  const [content, setContent] = useState('')

  useEffect(() => {
    if (cv) setContent(cv.content)
  }, [cv])

  const saveMutation = useMutation({
    mutationFn: () =>
      cv
        ? api.put(`/applications/${applicationId}/cv`, { name: cv.name, content }).then((r) => r.data)
        : api.post(`/applications/${applicationId}/cv`, { name: 'CV', content }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['application-cv', applicationId] })
      toast.success('CV saved')
    },
    onError: () => toast.error('Failed to save CV'),
  })

  const handleExport = async () => {
    try {
      const response = await api.get(`/applications/${applicationId}/cv/export`, {
        responseType: 'blob',
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `cv-${applicationId}.docx`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch {
      toast.error('Failed to export CV')
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">
          {cv ? cv.name : 'No CV yet — write one below'}
        </h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={!cv}
          >
            <Download className="mr-2 h-4 w-4" />
            Export DOCX
          </Button>
          <Button size="sm" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            <Save className="mr-2 h-4 w-4" />
            {saveMutation.isPending ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      <div data-color-mode="light">
        <MDEditor
          value={content}
          onChange={(v) => setContent(v ?? '')}
          height={500}
          preview="live"
        />
      </div>
    </div>
  )
}
