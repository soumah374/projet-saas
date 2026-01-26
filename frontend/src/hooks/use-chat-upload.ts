import { useCreateDocument } from '../hooks/use-documents';

export function useChatUpload() {
  const createDocumentMutation = useCreateDocument();

  const uploadFile = async (file: File) => {
    // Determiner le type de document basé sur l'extension
    const extension = file.name.split('.').pop()?.toLowerCase();
    let documentType = 'other';

    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) {
      documentType = extension === 'webp' ? 'jpg' : extension!; // Map webp to jpg or handle accordingly if backend supports it
    } else if (['pdf', 'doc', 'docx', 'xls', 'xlsx'].includes(extension || '')) {
      documentType = extension!;
    }

    try {
      const result = await createDocumentMutation.mutateAsync({
        title: file.name,
        file: file,
        document_type: documentType,
        is_public: false,
        category: 'other',
        project: '', // Chat files are not linked to a project by default
      });

      return result.data;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  };

  return {
    uploadFile,
    isLoading: createDocumentMutation.isPending,
  };
}
