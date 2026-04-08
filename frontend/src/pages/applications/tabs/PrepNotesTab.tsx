import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import MDEditor from '@uiw/react-md-editor'
import { Plus, Save, Trash2, Copy, Pencil, X } from 'lucide-react'
import api from '@/lib/api'
import type { ApplicationPrepNote, PrepNoteLibraryItem } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface PrepNotesTabProps {
  applicationId: string
}

export function PrepNotesTab({ applicationId }: PrepNotesTabProps) {
  const qc = useQueryClient()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editContent, setEditContent] = useState('')
  const [newName, setNewName] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [libraryOpen, setLibraryOpen] = useState(false)

  const { data: notes, isLoading } = useQuery<ApplicationPrepNote[]>({
    queryKey: ['application-prep-notes', applicationId],
    queryFn: () => api.get(`/applications/${applicationId}/prep-notes`).then((r) => r.data),
  })

  const { data: libraryNotes } = useQuery<PrepNoteLibraryItem[]>({
    queryKey: ['prep-notes-library'],
    queryFn: () => api.get('/prep-notes-library').then((r) => r.data),
    enabled: libraryOpen,
  })

  const selected = notes?.find((n) => n.id === selectedId) ?? null

  const createMutation = useMutation({
    mutationFn: (payload: { name: string; content: string }) =>
      api.post(`/applications/${applicationId}/prep-notes`, payload).then((r) => r.data),
    onSuccess: (created: ApplicationPrepNote) => {
      qc.invalidateQueries({ queryKey: ['application-prep-notes', applicationId] })
      setSelectedId(created.id)
      setNewName('')
      setAddOpen(false)
      toast.success('Note added')
    },
    onError: () => toast.error('Failed to add note'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ noteId, ...payload }: { noteId: string; name: string; content: string }) =>
      api.put(`/applications/${applicationId}/prep-notes/${noteId}`, payload).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['application-prep-notes', applicationId] })
      setEditing(false)
      toast.success('Note saved')
    },
    onError: () => toast.error('Failed to save note'),
  })

  const deleteMutation = useMutation({
    mutationFn: (noteId: string) =>
      api.delete(`/applications/${applicationId}/prep-notes/${noteId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['application-prep-notes', applicationId] })
      setSelectedId(null)
      setEditing(false)
      toast.success('Note deleted')
    },
    onError: () => toast.error('Failed to delete note'),
  })

  const handleSelect = (note: ApplicationPrepNote) => {
    setSelectedId(note.id)
    setEditing(false)
  }

  const handleStartEdit = () => {
    if (!selected) return
    setEditName(selected.name)
    setEditContent(selected.content)
    setEditing(true)
  }

  const handleCancelEdit = () => {
    setEditing(false)
  }

  const handleSave = () => {
    if (!selectedId) return
    updateMutation.mutate({ noteId: selectedId, name: editName, content: editContent })
  }

  const handleCopyFromLibrary = (item: PrepNoteLibraryItem) => {
    createMutation.mutate({ name: item.name, content: item.content })
    setLibraryOpen(false)
  }

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="flex gap-4 min-h-[500px]">
      {/* Left: note list */}
      <div className="w-48 shrink-0 flex flex-col gap-1">
        <div className="flex gap-1 mb-1">
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="flex-1">
                <Plus className="mr-1 h-4 w-4" />
                Add
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-sm" aria-describedby={undefined}>
              <DialogHeader>
                <DialogTitle>New Prep Note</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 pt-2">
                <Input
                  placeholder="Note name..."
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newName.trim()) {
                      createMutation.mutate({ name: newName.trim(), content: '' })
                    }
                  }}
                  autoFocus
                />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => setAddOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    disabled={!newName.trim() || createMutation.isPending}
                    onClick={() => createMutation.mutate({ name: newName.trim(), content: '' })}
                  >
                    Create
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={libraryOpen} onOpenChange={setLibraryOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" title="Copy from Library">
                <Copy className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Copy from Prep Notes Library</DialogTitle>
              </DialogHeader>
              <div className="mt-2 max-h-96 overflow-y-auto space-y-2">
                {libraryNotes?.length === 0 && (
                  <p className="text-sm text-muted-foreground">No library notes found.</p>
                )}
                {libraryNotes?.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-md border p-3"
                  >
                    <div>
                      <p className="text-sm font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">{item.content}</p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => handleCopyFromLibrary(item)}>
                      Copy
                    </Button>
                  </div>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {notes?.length === 0 && (
          <p className="text-xs text-muted-foreground px-1">No notes yet.</p>
        )}
        {notes?.map((note) => (
          <button
            key={note.id}
            onClick={() => handleSelect(note)}
            className={cn(
              'w-full text-left rounded-md px-3 py-2 text-sm truncate transition-colors',
              selectedId === note.id
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted text-foreground',
            )}
          >
            {note.name}
          </button>
        ))}
      </div>

      {/* Right: note content */}
      <div className="flex-1 min-w-0">
        {!selected ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground border rounded-md">
            Select a note to view
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              {editing ? (
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="h-8 text-sm font-medium max-w-xs"
                />
              ) : (
                <h3 className="text-sm font-semibold">{selected.name}</h3>
              )}
              <div className="flex gap-2 shrink-0">
                {editing ? (
                  <>
                    <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                      <X className="mr-1 h-4 w-4" />
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleSave} disabled={updateMutation.isPending}>
                      <Save className="mr-1 h-4 w-4" />
                      {updateMutation.isPending ? 'Saving...' : 'Save'}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteMutation.mutate(selected.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleStartEdit}>
                      <Pencil className="mr-1 h-4 w-4" />
                      Edit
                    </Button>
                  </>
                )}
              </div>
            </div>

            {editing ? (
              <div data-color-mode="light">
                <MDEditor
                  value={editContent}
                  onChange={(v) => setEditContent(v ?? '')}
                  height={400}
                  preview="live"
                />
              </div>
            ) : (
              <div
                data-color-mode="light"
                className="prose prose-sm max-w-none rounded-md border p-6"
              >
                {selected.content ? (
                  <MDEditor.Markdown source={selected.content} />
                ) : (
                  <p className="text-sm italic text-muted-foreground">No content yet — click Edit to add some.</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
