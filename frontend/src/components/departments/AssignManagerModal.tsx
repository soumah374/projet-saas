import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { UserAutocomplete } from '@/components/ui/UserAutocomplete'
import { useDepartments } from '@/hooks/use-departments'
import { useUsers } from '@/hooks/use-users'
import { toast } from 'sonner'

interface AssignManagerModalProps {
  open: boolean
  onClose: () => void
  department: {
    id: number
    name: string
  }
}

export function AssignManagerModal({
  open,
  onClose,
  department,
}: AssignManagerModalProps) {
  const { assignManager } = useDepartments()
  const [userSearchTerm, setUserSearchTerm] = useState('')
  const { data: usersData, isLoading: loadingUsers } = useUsers({
    search: userSearchTerm || undefined
  })
  const [selectedUser, setSelectedUser] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const handleClose = (open: boolean) => {
    if (!open) {
      setSelectedUser('')
      setUserSearchTerm('')
      onClose()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser) return

    setLoading(true)
    try {
      await assignManager({ id: department.id, data: { manager_id: parseInt(selectedUser) } })
      toast.success('Manager assigné avec succès')
      setSelectedUser('')
      setUserSearchTerm('')
      onClose()
    } catch (error) {
      toast.error("Erreur lors de l'assignation du manager")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assigner un manager</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="manager">Manager</Label>
            <UserAutocomplete
              value={selectedUser}
              onValueChange={setSelectedUser}
              placeholder="Sélectionner un manager"
              users={usersData?.data?.results || []}
              isLoading={loadingUsers}
              showClearButton={true}
              onSearchChange={setUserSearchTerm}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => handleClose(false)} type="button">
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={loading || !selectedUser}
            >
              {loading ? 'Assignation...' : 'Assigner'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 