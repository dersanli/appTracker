import { useState, useEffect, useSyncExternalStore } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import MDEditor from '@uiw/react-md-editor'
import api from '@/lib/api'
import type { ApplicationCV, CVLibraryItem } from '@/types'
import { Button } from '@/components/ui/button'
import { Save, Download, Copy, Pencil, X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

interface CVTabProps {
  applicationId: string
}

const getEditorHeight = () =>
  window.innerWidth < 768 ? Math.max(300, window.innerHeight - 300) : 500
const subscribe = (cb: () => void) => {
  window.addEventListener('resize', cb)
  return () => window.removeEventListener('resize', cb)
}

export function CVTab({ applicationId }: CVTabProps) {
  const editorHeight = useSyncExternalStore(subscribe, getEditorHeight, () => 500)
  const mobile = editorHeight < 500
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
  const [editing, setEditing] = useState(false)
  const [libraryOpen, setLibraryOpen] = useState(false)

  const { data: libraryItems } = useQuery<CVLibraryItem[]>({
    queryKey: ['cv-library'],
    queryFn: () => api.get('/cv-library').then((r) => r.data),
    enabled: libraryOpen,
  })

  useEffect(() => {
    if (cv) {
      setContent(cv.content)
    } else if (cv === null) {
      setEditing(true)
    }
  }, [cv])

  const saveMutation = useMutation({
    mutationFn: () =>
      cv
        ? api.put(`/applications/${applicationId}/cv`, { name: cv.name, content }).then((r) => r.data)
        : api.post(`/applications/${applicationId}/cv`, { name: 'CV', content }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['application-cv', applicationId] })
      toast.success('CV saved')
      setEditing(false)
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
          {cv ? cv.name : 'No CV yet — write one below or copy from library'}
        </h3>

        {editing ? (
          <div className="flex gap-2">
            <Dialog open={libraryOpen} onOpenChange={setLibraryOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Copy className="mr-2 h-4 w-4" />
                  Copy from Library
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Copy from CV Library</DialogTitle>
                </DialogHeader>
                <div className="mt-2 max-h-96 overflow-y-auto space-y-2">
                  {libraryItems?.length === 0 && (
                    <p className="text-sm text-muted-foreground">No CVs in library.</p>
                  )}
                  {libraryItems?.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-md border p-3"
                    >
                      <div>
                        <p className="text-sm font-medium">{item.name}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">{item.content}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setContent(item.content)
                          setLibraryOpen(false)
                          toast.success(`Copied "${item.name}" — save to apply`)
                        }}
                      >
                        Copy
                      </Button>
                    </div>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
            {cv && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setContent(cv.content)
                  setEditing(false)
                }}
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
            )}
            <Button size="sm" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
              <Save className="mr-2 h-4 w-4" />
              {saveMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExport} disabled={!cv}>
              <Download className="mr-2 h-4 w-4" />
              Export DOCX
            </Button>
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </div>
        )}
      </div>

      {editing ? (
        <div data-color-mode="light">
          <MDEditor
            value={content}
            onChange={(v) => setContent(v ?? '')}
            height={editorHeight}
            preview={mobile ? 'edit' : 'live'}
          />
        </div>
      ) : (
        <div
          data-color-mode="light"
          className="prose prose-sm max-w-none rounded-md border p-6"
        >
          <MDEditor.Markdown source={content} />
        </div>
      )}
    </div>
  )
}
