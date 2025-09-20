import { EmailTemplate, EmailTemplateCreate, EmailTemplateVariable, EmailTemplatePreview } from '@/types/email-template';
import { api } from '@/lib/api';

export const emailTemplateService = {
  // Templates
  getTemplates: async (): Promise<EmailTemplate[]> => {
    const response = await api.get('/email-templates/templates/');
    return response.data.results || response.data;
  },

  getTemplate: async (id: number): Promise<EmailTemplate> => {
    const response = await api.get(`/email-templates/templates/${id}/`);
    return response.data;
  },

  createTemplate: async (data: EmailTemplateCreate): Promise<EmailTemplate> => {
    const response = await api.post('/email-templates/templates/', data);
    return response.data;
  },

  updateTemplate: async (id: number, data: Partial<EmailTemplateCreate>): Promise<EmailTemplate> => {
    const response = await api.patch(`/email-templates/templates/${id}/`, data);
    return response.data;
  },

  deleteTemplate: async (id: number): Promise<void> => {
    await api.delete(`/email-templates/templates/${id}/`);
  },

  setAsDefault: async (id: number): Promise<{ message: string }> => {
    const response = await api.post(`/email-templates/templates/${id}/set_as_default/`);
    return response.data;
  },

  previewTemplate: async (id: number, contextData?: Record<string, string>): Promise<EmailTemplatePreview> => {
    const response = await api.post(`/email-templates/templates/${id}/preview/`, {
      context_data: contextData || {}
    });
    return response.data;
  },

  getTemplatesByType: async (): Promise<Record<string, { name: string; templates: EmailTemplate[] }>> => {
    const response = await api.get('/email-templates/templates/by_type/');
    return response.data;
  },

  // Variables
  getVariables: async (): Promise<EmailTemplateVariable[]> => {
    const response = await api.get('/email-templates/variables/');
    return response.data;
  },

  getVariablesByType: async (): Promise<Record<string, { name: string; variables: EmailTemplateVariable[] }>> => {
    const response = await api.get('/email-templates/variables/by_type/');
    return response.data;
  },
};
