import { useCallback, useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import { departmentsAPI } from '@/lib/api'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export interface Department {
  id: number
  name: string
  description: string
  created_at: string
  updated_at: string
  is_active: boolean
  current_manager: {
    id: number
    name: string
    since: string
  } | null
  projects_count: number
  team_members_count: number
  active_projects_count: number
  manager_history: Array<{
    id: number
    manager: number
    manager_name: string
    start_date: string
    end_date: string | null
    notes: string
    created_at: string
  }>
}

export interface DepartmentRequest {
  name: string
  description: string
  is_active?: boolean
}

export interface AssignManagerRequest {
  manager_id: number
  start_date?: string
  notes?: string
}

interface UseDepartmentsOptions {
  onSuccess?: () => void
  onError?: (error: Error) => void
}

export function useDepartments(options: UseDepartmentsOptions = {}) {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: departments = [], isLoading: loading } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const response = await departmentsAPI.getDepartments()
      return response.data.results
    }
  })

  const createDepartmentMutation = useMutation({
    mutationFn: (data: DepartmentRequest) => departmentsAPI.createDepartment(data),
    onSuccess: (response) => {
      queryClient.setQueryData(['departments'], (old: Department[] = []) => [...old, response.data])
      toast({
        title: 'Succès',
        description: 'Département créé avec succès',
      })
      options.onSuccess?.()
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la création',
        variant: 'destructive',
      })
      options.onError?.(error)
    }
  })

  const updateDepartmentMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: DepartmentRequest }) => 
      departmentsAPI.updateDepartment(id, data),
    onSuccess: (response, { id }) => {
      queryClient.setQueryData(['departments'], (old: Department[] = []) =>
        old.map(dept => (dept.id === id ? response.data : dept))
      )
      toast({
        title: 'Succès',
        description: 'Département mis à jour avec succès',
      })
      options.onSuccess?.()
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la mise à jour',
        variant: 'destructive',
      })
      options.onError?.(error)
    }
  })

  const deleteDepartmentMutation = useMutation({
    mutationFn: (id: number) => departmentsAPI.deleteDepartment(id),
    onSuccess: (_, id) => {
      queryClient.setQueryData(['departments'], (old: Department[] = []) =>
        old.filter(dept => dept.id !== id)
      )
      toast({
        title: 'Succès',
        description: 'Département supprimé avec succès',
      })
      options.onSuccess?.()
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la suppression',
        variant: 'destructive',
      })
      options.onError?.(error)
    }
  })

  const assignManagerMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: AssignManagerRequest }) =>
      departmentsAPI.assignManager(id, data),
    onSuccess: (response, { id }) => {
      queryClient.setQueryData(['departments'], (old: Department[] = []) =>
        old.map(dept => (dept.id === id ? response.data : dept))
      )
      toast({
        title: 'Succès',
        description: 'Manager assigné avec succès',
      })
      options.onSuccess?.()
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de l\'assignation',
        variant: 'destructive',
      })
      options.onError?.(error)
    }
  })

  const toggleActiveMutation = useMutation({
    mutationFn: (id: number) => departmentsAPI.toggleActive(id),
    onSuccess: (response, id) => {
      queryClient.setQueryData(['departments'], (old: Department[] = []) =>
        old.map(dept => (dept.id === id ? response.data : dept))
      )
      toast({
        title: 'Succès',
        description: 'Statut du département mis à jour avec succès',
      })
      options.onSuccess?.()
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors du changement de statut',
        variant: 'destructive',
      })
      options.onError?.(error)
    }
  })

  const getManagerHistory = useCallback(async (id: number) => {
    try {
      const response = await departmentsAPI.getManagerHistory(id)
      return response.data
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la récupération de l\'historique',
        variant: 'destructive',
      })
      throw error
    }
  }, [toast])

  return {
    departments,
    loading,
    createDepartment: createDepartmentMutation.mutate,
    updateDepartment: updateDepartmentMutation.mutate,
    deleteDepartment: deleteDepartmentMutation.mutate,
    assignManager: assignManagerMutation.mutate,
    toggleActive: toggleActiveMutation.mutate,
    getManagerHistory,
    isCreating: createDepartmentMutation.isPending,
    isUpdating: updateDepartmentMutation.isPending,
    isDeleting: deleteDepartmentMutation.isPending,
    isAssigning: assignManagerMutation.isPending,
    isTogglingActive: toggleActiveMutation.isPending
  }
} 