import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface Comment {
  id: number;
  task: number;
  author: number;
  author_details: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  };
  content: string;
  created_at: string;
  updated_at: string;
  parent: number | null;
  mentions: number[];
  mentioned_users: Array<{
    id: number;
    first_name: string;
    last_name: string;
  }>;
  attachments: Array<{
    name: string;
    url: string;
    type: string;
    size: number;
  }>;
  replies: Comment[];
}

export interface CreateCommentData {
  content: string;
  parent?: number | null;
  mentions?: number[];
  attachments?: Array<{
    name: string;
    url: string;
    type: string;
    size: number;
  }>;
}

export function useTaskComments(projectId: string, taskId: number) {
  return useQuery({
    queryKey: ['comments', projectId, taskId],
    queryFn: async () => {
      const response = await api.get(`/projects/${projectId}/tasks/${taskId}/comments/`);
      // Retourne directement le tableau ou results si c'est un objet paginé
      return response.data.results || response.data;
    },
  });
}

export function useCreateComment(projectId: string, taskId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateCommentData) => {
      const response = await api.post(
        `/projects/${projectId}/tasks/${taskId}/comments/`,
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', projectId, taskId] });
    },
  });
}

export function useUpdateComment(projectId: string, taskId: number, commentId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<CreateCommentData>) => {
      const response = await api.patch(
        `/projects/${projectId}/tasks/${taskId}/comments/${commentId}/`,
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', projectId, taskId] });
    },
  });
}

export function useDeleteComment(projectId: string, taskId: number, commentId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await api.delete(
        `/projects/${projectId}/tasks/${taskId}/comments/${commentId}/`
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', projectId, taskId] });
    },
  });
}

export function useUploadAttachment(projectId: string, taskId: number) {
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post(
        `/projects/${projectId}/tasks/${taskId}/comments/upload_attachment/`,
        formData
      );
      return response.data as {
        name: string;
        url: string;
        type: string;
        size: number;
      };
    },
  });
}
