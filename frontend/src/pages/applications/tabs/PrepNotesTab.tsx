import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import MDEditor from '@uiw/react-md-editor'
import { Plus, Save, Trash2, Copy } from 'lucide-react'
import api from '@/lib/api'
import type { ApplicationPrepNote, PrepNoteLibraryItem } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

interface PrepNotesTabProps {
  applicationId: string
}

interface NoteEditorState {
  id: string
  name: string
  content: string
}

export function PrepNotesTab({ applicationId }: PrepNotesTabProps) {
  const qc = useQueryClient()
  const [editingNotes, setEditingNotes] = useState<Record<string, NoteEditorState>>({})
  const [newName, setNewName] = useState('')
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

  const createMutation = useMutation({
    mutationFn: (payload: { name: string; content: string }) =>
      api.post(`/applications/${applicationId}/prep-notes`, payload).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['application-prep-notes', applicationId] })
      setNewName('')
      toast.success('Prep note added')
    },
    onError: () => toast.error('Failed to add note'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ noteId, ...payload }: { noteId: string; name: string; content: string }) =>
      api.put(`/applications/${applicationId}/prep-notes/${noteId}`, payload).then((r) => r.data),
    onSuccess: (_, { noteId }) => {
      qc.invalidateQueries({ queryKey: ['application-prep-notes', applicationId] })
      setEditingNotes((prev) => {
        const next = { ...prev }
        delete next[noteId]
        return next
      })
      toast.success('Note updated')
    },
    onError: () => toast.error('Failed to update note'),
  })

  const deleteMutation = useMutation({
    mutationFn: (noteId: string) =>
      api.delete(`/applications/${applicationId}/prep-notes/${noteId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['application-prep-notes', applicationId] })
      toast.success('Note deleted')
    },
    onError: () => toast.error('Failed to delete note'),
  })

  const handleStartEdit = (note: ApplicationPrepNote) => {
    setEditingNotes((prev) => ({
      ...prev,
      [note.id]: { id: note.id, name: note.name, content: note.content },
    }))
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Prep Notes ({notes?.length ?? 0})</h3>
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
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCopyFromLibrary(item)}
                    >
                      Copy
                    </Button>
                  </div>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Add new note */}
      <Card>
        <CardHeader className="pb-2">
          <p className="text-sm font-medium">Add New Note</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            placeholder="Note name..."
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <Button
            size="sm"
            disabled={!newName.trim() || createMutation.isPending}
            onClick={() => createMutation.mutate({ name: newName.trim(), content: '' })}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Note
          </Button>
        </CardContent>
      </Card>

      {/* Existing notes */}
      {notes?.map((note) => {
        const editing = editingNotes[note.id]
        return (
          <Card key={note.id}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              {editing ? (
                <Input
                  value={editing.name}
                  onChange={(e) =>
                    setEditingNotes((prev) => ({
                      ...prev,
                      [note.id]: { ...prev[note.id], name: e.target.value },
                    }))
                  }
                  className="h-7 text-sm font-medium"
                />
              ) : (
                <p className="text-sm font-medium">{note.name}</p>
              )}
              <div className="flex gap-1 ml-2 shrink-0">
                {editing ? (
                  <>
                    <Button
                      size="sm"
                      onClick={() =>
                        updateMutation.mutate({
                          noteId: note.id,
                          name: editing.name,
                          content: editing.content,
                        })
                      }
                      disabled={updateMutation.isPending}
                    >
                      <Save className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setEditingNotes((prev) => {
                          const next = { ...prev }
                          delete next[note.id]
                          return next
                        })
                      }
                    >
                      Cancel
                    </Button>
                  </>
                ) : (
                  <>
                    <Button size="sm" variant="outline" onClick={() => handleStartEdit(note)}>
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteMutation.mutate(note.id)}
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
                      setEditingNotes((prev) => ({
                        ...prev,
                        [note.id]: { ...prev[note.id], content: v ?? '' },
                      }))
                    }
                    height={300}
                    preview="live"
                  />
                </div>
              ) : (
                <div data-color-mode="light" className="text-sm text-muted-foreground">
                  {note.content ? (
                    <MDEditor.Markdown source={note.content} />
                  ) : (
                    <p className="italic">No content yet.</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
