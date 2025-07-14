import { useState, useCallback } from 'react';
import { useToast } from './use-toast';
import { projectApi, Project, ProjectPhase, ProjectTask, TimeSheet } from '../lib/api';

interface UseProjectLifecycle {
    // États
    loading: boolean;
    error: string | null;
    project: Project | null;
    phases: ProjectPhase[];
    tasks: ProjectTask[];
    timeSheets: TimeSheet[];
    
    // Actions
    loadProject: (projectId: string) => Promise<void>;
    updateProjectStatus: (status: Project['status']) => Promise<void>;
    createPhase: (data: Partial<ProjectPhase>) => Promise<void>;
    updatePhase: (phaseId: number, data: Partial<ProjectPhase>) => Promise<void>;
    reorderPhase: (phaseId: number, order: number) => Promise<void>;
    createTask: (data: Partial<ProjectTask>) => Promise<void>;
    updateTask: (taskId: number, data: Partial<ProjectTask>) => Promise<void>;
    updateTaskStatus: (taskId: number, status: ProjectTask['status']) => Promise<void>;
    assignTask: (taskId: number, userId: number) => Promise<void>;
    createTimeSheet: (data: Partial<TimeSheet>) => Promise<void>;
    validateTimeSheet: (timeSheetId: number) => Promise<void>;
}

export function useProjectLifecycle(projectId: string): UseProjectLifecycle {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [project, setProject] = useState<Project | null>(null);
    const [phases, setPhases] = useState<ProjectPhase[]>([]);
    const [tasks, setTasks] = useState<ProjectTask[]>([]);
    const [timeSheets, setTimeSheets] = useState<TimeSheet[]>([]);
    
    const { toast } = useToast();
    
    // Charger les données du projet
    const loadProject = useCallback(async () => {
        setLoading(true);
        setError(null);
        
        try {
            const [projectData, phasesData, tasksData, timeSheetsData] = await Promise.all([
                projectApi.getProject(projectId),
                projectApi.getProjectPhases(projectId),
                projectApi.getProjectTasks(projectId),
                projectApi.getProjectTimeSheets(projectId),
            ]);
            
            setProject(projectData.data);
            setPhases(phasesData.data.results);
            setTasks(tasksData.data.results);
            setTimeSheets(timeSheetsData.data.results);
        } catch (err) {
            setError('Erreur lors du chargement du projet');
            toast({
                title: 'Erreur',
                description: 'Impossible de charger les données du projet',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    }, [projectId, toast]);
    
    // Mettre à jour le statut du projet
    const updateProjectStatus = useCallback(async (status: Project['status']) => {
        try {
            await projectApi.updateProjectStatus(projectId, status);
            await loadProject();
            toast({
                title: 'Succès',
                description: 'Le statut du projet a été mis à jour',
            });
        } catch (err) {
            toast({
                title: 'Erreur',
                description: 'Impossible de mettre à jour le statut du projet',
                variant: 'destructive',
            });
        }
    }, [projectId, loadProject, toast]);
    
    // Gérer les phases
    const createPhase = useCallback(async (data: Partial<ProjectPhase>) => {
        try {
            await projectApi.createProjectPhase(projectId, data);
            await loadProject();
            toast({
                title: 'Succès',
                description: 'La phase a été créée',
            });
        } catch (err) {
            toast({
                title: 'Erreur',
                description: 'Impossible de créer la phase',
                variant: 'destructive',
            });
        }
    }, [projectId, loadProject, toast]);
    
    const updatePhase = useCallback(async (phaseId: number, data: Partial<ProjectPhase>) => {
        try {
            await projectApi.updateProjectPhase(projectId, phaseId, data);
            await loadProject();
            toast({
                title: 'Succès',
                description: 'La phase a été mise à jour',
            });
        } catch (err) {
            toast({
                title: 'Erreur',
                description: 'Impossible de mettre à jour la phase',
                variant: 'destructive',
            });
        }
    }, [projectId, loadProject, toast]);
    
    const reorderPhase = useCallback(async (phaseId: number, order: number) => {
        try {
            await projectApi.reorderPhase(projectId, phaseId, order);
            await loadProject();
        } catch (err) {
            toast({
                title: 'Erreur',
                description: 'Impossible de réorganiser les phases',
                variant: 'destructive',
            });
        }
    }, [projectId, loadProject, toast]);
    
    // Gérer les tâches
    const createTask = useCallback(async (data: Partial<ProjectTask>) => {
        try {
            await projectApi.createProjectTask(projectId, data);
            await loadProject();
            toast({
                title: 'Succès',
                description: 'La tâche a été créée',
            });
        } catch (err) {
            toast({
                title: 'Erreur',
                description: 'Impossible de créer la tâche',
                variant: 'destructive',
            });
        }
    }, [projectId, loadProject, toast]);
    
    const updateTask = useCallback(async (taskId: number, data: Partial<ProjectTask>) => {
        try {
            await projectApi.updateProjectTask(projectId, taskId, data);
            await loadProject();
            toast({
                title: 'Succès',
                description: 'La tâche a été mise à jour',
            });
        } catch (err) {
            toast({
                title: 'Erreur',
                description: 'Impossible de mettre à jour la tâche',
                variant: 'destructive',
            });
        }
    }, [projectId, loadProject, toast]);
    
    const updateTaskStatus = useCallback(async (taskId: number, status: ProjectTask['status']) => {
        try {
            await projectApi.updateTaskStatus(projectId, taskId, status);
            await loadProject();
            toast({
                title: 'Succès',
                description: 'Le statut de la tâche a été mis à jour',
            });
        } catch (err) {
            toast({
                title: 'Erreur',
                description: 'Impossible de mettre à jour le statut de la tâche',
                variant: 'destructive',
            });
        }
    }, [projectId, loadProject, toast]);
    
    const assignTask = useCallback(async (taskId: number, userId: number) => {
        try {
            await projectApi.assignTask(projectId, taskId, userId);
            await loadProject();
            toast({
                title: 'Succès',
                description: 'La tâche a été assignée',
            });
        } catch (err) {
            toast({
                title: 'Erreur',
                description: 'Impossible d\'assigner la tâche',
                variant: 'destructive',
            });
        }
    }, [projectId, loadProject, toast]);
    
    // Gérer les feuilles de temps
    const createTimeSheet = useCallback(async (data: Partial<TimeSheet>) => {
        try {
            await projectApi.createProjectTimeSheet(projectId, data);
            await loadProject();
            toast({
                title: 'Succès',
                description: 'La feuille de temps a été créée',
            });
        } catch (err) {
            toast({
                title: 'Erreur',
                description: 'Impossible de créer la feuille de temps',
                variant: 'destructive',
            });
        }
    }, [projectId, loadProject, toast]);
    
    const validateTimeSheet = useCallback(async (timeSheetId: number) => {
        try {
            await projectApi.validateTimeSheet(projectId, timeSheetId);
            await loadProject();
            toast({
                title: 'Succès',
                description: 'La feuille de temps a été validée',
            });
        } catch (err) {
            toast({
                title: 'Erreur',
                description: 'Impossible de valider la feuille de temps',
                variant: 'destructive',
            });
        }
    }, [projectId, loadProject, toast]);
    
    return {
        loading,
        error,
        project,
        phases,
        tasks,
        timeSheets,
        loadProject,
        updateProjectStatus,
        createPhase,
        updatePhase,
        reorderPhase,
        createTask,
        updateTask,
        updateTaskStatus,
        assignTask,
        createTimeSheet,
        validateTimeSheet,
    };
} 