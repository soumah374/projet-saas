import { useState } from 'react'
import { Plus, Edit, Trash2, UserPlus, History, Power, Search, ArrowUpDown } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

import { useDepartments, Department } from '@/hooks/use-departments'
import { formatDate } from '@/lib/utils'

import { CreateDepartmentModal } from '@/components/departments/CreateDepartmentModal'
import { AssignManagerModal } from '@/components/departments/AssignManagerModal'
import { ManagerHistoryModal } from '@/components/departments/ManagerHistoryModal'
import { EditDepartmentModal } from '@/components/departments/EditDepartmentModal'
import { DeleteDepartmentModal } from '@/components/departments/DeleteDepartmentModal'
import { usePermissions } from '@/hooks/use-permissions'

type SortField = 'name' | 'active_projects_count' | 'team_members_count' | 'created_at'
type SortOrder = 'asc' | 'desc'

export default function DepartmentsPage() {
  const {
    departments,
    loading,
    toggleActive,
  } = useDepartments({
    onSuccess: () => {
      setShowCreateModal(false)
      setShowEditModal(false)
      setShowDeleteModal(false)
      setShowAssignModal(false)
      setShowHistoryModal(false)
      setSelectedDepartment(null)
    },
  })

  const { hasPermission } = usePermissions();

  const [searchQuery, setSearchQuery] = useState('')
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null)

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  const sortedAndFilteredDepartments = departments
    .filter((department) =>
      department.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      const modifier = sortOrder === 'asc' ? 1 : -1
      
      switch (sortField) {
        case 'name':
          return a.name.localeCompare(b.name) * modifier
        case 'active_projects_count':
          return (a.active_projects_count - b.active_projects_count) * modifier
        case 'team_members_count':
          return (a.team_members_count - b.team_members_count) * modifier
        case 'created_at':
          return (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * modifier
        default:
          return 0
      }
    })

  const handleEdit = (department: Department) => {
    setSelectedDepartment(department)
    setShowEditModal(true)
  }

  const handleDelete = (department: Department) => {
    setSelectedDepartment(department)
    setShowDeleteModal(true)
  }

  const handleAssignManager = (department: Department) => {
    setSelectedDepartment(department)
    setShowAssignModal(true)
  }

  const handleShowHistory = (department: Department) => {
    setSelectedDepartment(department)
    setShowHistoryModal(true)
  }

  const handleToggleActive = async (department: Department) => {
    await toggleActive(department.id)
  }

  const handleCloseModals = () => {
    setShowCreateModal(false)
    setShowEditModal(false)
    setShowDeleteModal(false)
    setShowAssignModal(false)
    setShowHistoryModal(false)
    setSelectedDepartment(null)
  }

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      onClick={() => handleSort(field)}
      className="h-8 px-2 hover:bg-transparent"
    >
      {children}
      <ArrowUpDown className="ml-2 h-4 w-4" />
    </Button>
  )

  return (
    <div className="max-w-8xl mx-auto space-y-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Départements</CardTitle>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un département..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            {hasPermission('departments.can_create_departments') && (
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nouveau département
            </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-4">Chargement...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <SortButton field="name">Nom</SortButton>
                  </TableHead>
                  <TableHead>Manager actuel</TableHead>
                  <TableHead>
                    <SortButton field="active_projects_count">Projets actifs</SortButton>
                  </TableHead>
                  <TableHead>
                    <SortButton field="team_members_count">Membres</SortButton>
                  </TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>
                    <SortButton field="created_at">Créé le</SortButton>
                  </TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedAndFilteredDepartments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">
                      Aucun département trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedAndFilteredDepartments.map((department) => (
                    <TableRow key={department.id}>
                      <TableCell className="font-medium">
                        {department.name}
                      </TableCell>
                      <TableCell>
                        {department.current_manager ? (
                          <div>
                            <div>{department.current_manager.name}</div>
                            <div className="text-sm text-gray-500">
                              Depuis le {formatDate(department.current_manager.since)}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-500">Non assigné</span>
                        )}
                      </TableCell>
                      <TableCell>{department.active_projects_count}</TableCell>
                      <TableCell>{department.team_members_count}</TableCell>
                      <TableCell>
                        <Badge
                          variant={department.is_active ? 'default' : 'secondary'}
                        >
                          {department.is_active ? 'Actif' : 'Inactif'}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(department.created_at)}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          {hasPermission('departments.can_edit_departments') && (
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleEdit(department)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          )}
                          {hasPermission('departments.can_assign_manager') && (
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleAssignManager(department)}
                          >
                            <UserPlus className="h-4 w-4" />
                          </Button>
                          )}
                          {hasPermission('departments.can_show_history') && (
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleShowHistory(department)}
                          >
                            <History className="h-4 w-4" />
                          </Button>
                          )}
                          {hasPermission('departments.can_toggle_active') && (
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleToggleActive(department)}
                          >
                            <Power className="h-4 w-4" />
                          </Button>
                          )}
                          {hasPermission('departments.can_delete_departments') && (
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleDelete(department)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {showCreateModal && (
        <CreateDepartmentModal
          open={showCreateModal}
          onClose={handleCloseModals}
        />
      )}

      {showEditModal && selectedDepartment && (
        <EditDepartmentModal
          open={showEditModal}
          onClose={handleCloseModals}
          department={selectedDepartment}
        />
      )}

      {showDeleteModal && selectedDepartment && (
        <DeleteDepartmentModal
          open={showDeleteModal}
          onClose={handleCloseModals}
          department={selectedDepartment}
        />
      )}

      {showAssignModal && selectedDepartment && (
        <AssignManagerModal
          open={showAssignModal}
          onClose={handleCloseModals}
          department={selectedDepartment}
        />
      )}

      {showHistoryModal && selectedDepartment && (
        <ManagerHistoryModal
          open={showHistoryModal}
          onClose={handleCloseModals}
          department={selectedDepartment}
        />
      )}
    </div>
  )
} 