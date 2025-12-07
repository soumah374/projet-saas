import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { documentsAPI } from '@/lib/api';
import type { Document } from '@/lib/types';

interface CreateDocumentDTO {
  title: string;
  description?: string;
  file: File;
  document_type: string;
  is_public: boolean;
  category: string;
  tags?: string[];
  project?: string;
}

interface UpdateDocumentDTO extends Partial<CreateDocumentDTO> {
  id: number;
}

export const useDocuments = (projectId?: string) => {
  return useQuery({
    queryKey: ['documents', projectId],
    queryFn: () => documentsAPI.getDocuments(projectId ? { project: projectId } : undefined),
  });
};

export const useCreateDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateDocumentDTO) => {
      const formData = new FormData();
      formData.append('title', data.title);
      if (data.description) formData.append('description', data.description);
      formData.append('file', data.file);
      formData.append('document_type', data.document_type);
      formData.append('is_public', String(data.is_public));
      formData.append('category', data.category);
      formData.append('project',data.project)
      if (data.tags) formData.append('tags', JSON.stringify(data.tags));
      if (data.project) formData.append('project', data.project);

      return documentsAPI.uploadDocument(formData);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['documents', variables.project] });
    },
  });
};

export const useUpdateDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: UpdateDocumentDTO) => {
      const formData = new FormData();
      if (data.title) formData.append('title', data.title);
      if (data.description) formData.append('description', data.description);
      if (data.file) formData.append('file', data.file);
      if (data.document_type) formData.append('document_type', data.document_type);
      if (data.is_public !== undefined) formData.append('is_public', String(data.is_public));
      if (data.category) formData.append('category', data.category);
      if (data.tags) formData.append('tags', JSON.stringify(data.tags));
      if (data.project) formData.append('project', data.project);

      return documentsAPI.updateDocument(id, formData);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['documents', variables.project] });
    },
  });
};

export const useDeleteDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: documentsAPI.deleteDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });
}; 