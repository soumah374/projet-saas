import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
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
  const { data: usersData, isLoading: loadingUsers } = useUsers()
  const [selectedUser, setSelectedUser] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser) return

    setLoading(true)
    try {
      await assignManager({ id: department.id, data: { manager_id: parseInt(selectedUser) } })
      toast.success('Manager assigné avec succès')
      onClose()
    } catch (error) {
      toast.error("Erreur lors de l'assignation du manager")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assigner un manager</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="manager">Manager</Label>
            <Select
              value={selectedUser}
              onValueChange={setSelectedUser}
              disabled={loadingUsers}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un manager" />
              </SelectTrigger>
              <SelectContent>
                {usersData?.data?.results?.map((user) => (
                  <SelectItem key={user.id} value={user.id.toString()}>
                    {user.first_name} {user.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose} type="button">
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