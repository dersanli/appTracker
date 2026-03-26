import { useState, useEffect, useSyncExternalStore } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import MDEditor from '@uiw/react-md-editor'
import { Plus, Save, Trash2, ArrowLeft } from 'lucide-react'
import api from '@/lib/api'
import type { PrepNoteLibraryItem } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

interface EditorState {
  id: string
  name: string
  content: string
}

const isMobile = () => window.innerWidth < 768
const subscribe = (cb: () => void) => {
  window.addEventListener('resize', cb)
  return () => window.removeEventListener('resize', cb)
}

export function PrepNotesLibrary() {
  const mobile = useSyncExternalStore(subscribe, isMobile, () => false)
  useDocumentTitle('Prep Notes')
  const qc = useQueryClient()
  const [editingItems, setEditingItems] = useState<Record<string, EditorState>>({})
  const [newDialogOpen, setNewDialogOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [mobileShowEditor, setMobileShowEditor] = useState(false)

  const { data: items, isLoading } = useQuery<PrepNoteLibraryItem[]>({
    queryKey: ['prep-notes-library'],
    queryFn: () => api.get('/prep-notes-library').then((r) => r.data),
  })

  useEffect(() => {
    if (items && items.length > 0 && !selectedId) {
      setSelectedId(items[0].id)
    }
  }, [items, selectedId])

  const selectedItem = items?.find((i) => i.id === selectedId) ?? items?.[0]

  const createMutation = useMutation({
    mutationFn: (payload: { name: string; content: string }) =>
      api.post('/prep-notes-library', payload).then((r) => r.data),
    onSuccess: (newItem: PrepNoteLibraryItem) => {
      qc.invalidateQueries({ queryKey: ['prep-notes-library'] })
      setNewDialogOpen(false)
      setNewName('')
      setSelectedId(newItem.id)
      setMobileShowEditor(true)
      toast.success('Note created')
    },
    onError: () => toast.error('Failed to create note'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, ...payload }: { id: string; name: string; content: string }) =>
      api.put(`/prep-notes-library/${id}`, payload).then((r) => r.data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['prep-notes-library'] })
      setEditingItems((prev) => {
        const next = { ...prev }
        delete next[id]
        return next
      })
      toast.success('Note saved')
    },
    onError: () => toast.error('Failed to save note'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/prep-notes-library/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['prep-notes-library'] })
      setSelectedId(null)
      setMobileShowEditor(false)
      toast.success('Note deleted')
    },
    onError: () => toast.error('Failed to delete note'),
  })

  const startEdit = (item: PrepNoteLibraryItem) => {
    setEditingItems((prev) => ({
      ...prev,
      [item.id]: { id: item.id, name: item.name, content: item.content },
    }))
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  const editing = selectedItem ? editingItems[selectedItem.id] : undefined

  const listPanel = (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Prep Notes Library</h3>
        <Button size="sm" variant="outline" onClick={() => setNewDialogOpen(true)}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      {items?.length === 0 && (
        <p className="text-sm text-muted-foreground">No notes yet. Create one.</p>
      )}
      {items?.map((item) => (
        <button
          key={item.id}
          className={`w-full text-left rounded-md px-3 py-2 text-sm transition-colors ${
            selectedId === item.id
              ? 'bg-primary text-primary-foreground'
              : 'hover:bg-accent hover:text-accent-foreground'
          }`}
          onClick={() => {
            setSelectedId(item.id)
            setMobileShowEditor(true)
          }}
        >
          <div className="font-medium truncate">{item.name}</div>
          <div
            className={`text-xs ${selectedId === item.id ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}
          >
            {formatDate(item.updated_at)}
          </div>
        </button>
      ))}
    </div>
  )

  const editorPanel = selectedItem ? (
    <div className="flex-1 space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3">
          <div className="flex items-center gap-2 min-w-0">
            <Button
              size="sm"
              variant="ghost"
              className="shrink-0 md:hidden"
              onClick={() => setMobileShowEditor(false)}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            {editing ? (
              <Input
                value={editing.name}
                onChange={(e) =>
                  setEditingItems((prev) => ({
                    ...prev,
                    [selectedItem.id]: { ...prev[selectedItem.id], name: e.target.value },
                  }))
                }
                className="h-7 text-base font-semibold max-w-xs"
              />
            ) : (
              <h3 className="text-base font-semibold truncate">{selectedItem.name}</h3>
            )}
          </div>
          <div className="flex shrink-0 gap-2">
            {editing ? (
              <>
                <Button
                  size="sm"
                  onClick={() =>
                    updateMutation.mutate({
                      id: selectedItem.id,
                      name: editing.name,
                      content: editing.content,
                    })
                  }
                  disabled={updateMutation.isPending}
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setEditingItems((prev) => {
                      const next = { ...prev }
                      delete next[selectedItem.id]
                      return next
                    })
                  }
                >
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Button size="sm" variant="outline" onClick={() => startEdit(selectedItem)}>
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => deleteMutation.mutate(selectedItem.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {editing ? (
            <div data-color-mode="light">
              <MDEditor
                value={editing.content}
                onChange={(v) =>
                  setEditingItems((prev) => ({
                    ...prev,
                    [selectedItem.id]: { ...prev[selectedItem.id], content: v ?? '' },
                  }))
                }
                height={500}
                preview={mobile ? 'edit' : 'live'}
              />
            </div>
          ) : (
            <div data-color-mode="light" className="prose prose-sm max-w-none">
              <MDEditor.Markdown
                source={selectedItem.content || '*No content yet. Click Edit to start writing.*'}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  ) : (
    <div className="flex-1 flex items-center justify-center text-muted-foreground">
      Select a note or create a new one.
    </div>
  )

  return (
    <>
      {/* Desktop: two-pane side by side */}
      <div className="hidden md:flex gap-6 h-full">
        <div className="w-64 shrink-0">{listPanel}</div>
        {editorPanel}
      </div>

      {/* Mobile: single pane, toggle between list and editor */}
      <div className="md:hidden">
        {mobileShowEditor && selectedItem ? editorPanel : listPanel}
      </div>

      {/* New note dialog */}
      <Dialog open={newDialogOpen} onOpenChange={setNewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Prep Note</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Name</label>
              <Input
                className="mt-1"
                placeholder="e.g. System Design Prep"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setNewDialogOpen(false)}>Cancel</Button>
              <Button
                disabled={!newName.trim() || createMutation.isPending}
                onClick={() => createMutation.mutate({ name: newName.trim(), content: '' })}
              >
                Create
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
