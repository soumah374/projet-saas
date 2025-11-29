import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectApi, TimeSheet } from '@/lib/api';
import type { PaginatedResponse } from '@/lib/types';
import { toast } from 'sonner';

// Query keys
const timesheetKeys = {
  all: ['timesheets'] as const,
  lists: () => [...timesheetKeys.all, 'list'] as const,
  list: (projectId: string) => [...timesheetKeys.lists(), projectId] as const,
  details: () => [...timesheetKeys.all, 'detail'] as const,
  detail: (projectId: string, timesheetId: number) => [...timesheetKeys.details(), projectId, timesheetId] as const,
};

export const useTimesheets = (projectId: string) => {
  return useQuery<PaginatedResponse<TimeSheet>>({
    queryKey: timesheetKeys.list(projectId),
    queryFn: async () => {
      const response = await projectApi.getProjectTimeSheets(projectId);
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useTimesheet = (projectId: string, timesheetId: number) => {
  return useQuery<TimeSheet>({
    queryKey: timesheetKeys.detail(projectId, timesheetId),
    queryFn: async () => {
      const response = await projectApi.getProjectTimeSheet(projectId, timesheetId);
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useCreateTimesheet = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, data }: { projectId: string; data: any }) => {
      const response = await projectApi.createProjectTimeSheet(projectId, data);
      return response.data;
    },
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: timesheetKeys.list(projectId) });
      toast.success('Feuille de temps créée avec succès');
    },
    onError: () => {
      toast.error('Erreur lors de la création de la feuille de temps');
    },
  });
};

export const useUpdateTimesheet = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, timesheetId, data }: { projectId: string; timesheetId: number; data: any }) => {
      const response = await projectApi.updateProjectTimeSheet(projectId, timesheetId, data);
      return response.data;
    },
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: timesheetKeys.list(projectId) });
      toast.success('Feuille de temps mise à jour avec succès');
    },
    onError: () => {
      toast.error('Erreur lors de la mise à jour de la feuille de temps');
    },
  });
};

export const useDeleteTimesheet = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, timesheetId }: { projectId: string; timesheetId: number }) => {
      const response = await projectApi.deleteProjectTimeSheet(projectId, timesheetId);
      return response.data;
    },
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: timesheetKeys.list(projectId) });
      toast.success('Feuille de temps supprimée avec succès');
    },
    onError: () => {
      toast.error('Erreur lors de la suppression de la feuille de temps');
    },
  });
};

export const useValidateTimesheet = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, timesheetId, comment }: { projectId: string; timesheetId: number; comment?: string }) => {
      const response = await projectApi.validateTimeSheet(projectId, timesheetId, comment);
      return response.data;
    },
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: timesheetKeys.list(projectId) });
      toast.success('Feuille de temps validée avec succès');
    },
    onError: () => {
      toast.error('Erreur lors de la validation de la feuille de temps');
    },
  });
}; 