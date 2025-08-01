import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { formatDate } from '@/lib/utils'

interface ManagerHistoryModalProps {
  open: boolean
  onClose: () => void
  department: {
    id: number
    name: string
    manager_history: Array<{
      id: number
      manager_name: string
      start_date: string
      end_date: string | null
    }>
  }
}

export function ManagerHistoryModal({
  open,
  onClose,
  department,
}: ManagerHistoryModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Historique des managers</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {department.manager_history.map((entry) => (
              <div
                key={entry.id}
                className="rounded-lg border p-4"
              >
                <div className="font-medium">{entry.manager_name}</div>
                <div className="text-sm text-gray-500">
                  Du {formatDate(entry.start_date)}
                  {entry.end_date
                    ? ` au ${formatDate(entry.end_date)}`
                    : " jusqu'à maintenant"}
                </div>
              </div>
            ))}
            {department.manager_history.length === 0 && (
              <div className="text-center text-gray-500">
                Aucun historique disponible
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
} 