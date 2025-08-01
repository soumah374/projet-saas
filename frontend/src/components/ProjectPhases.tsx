import { useState } from 'react';
import { useProjectLifecycle } from '../hooks/use-project-lifecycle';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Form, FormField, FormItem, FormLabel, FormControl } from './ui/form';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Calendar } from './ui/calendar';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

interface Phase {
    id: number;
    name: string;
    description: string;
    start_date: string;
    end_date: string;
    progress: number;
    order: number;
    project: string;
}

const phaseSchema = z.object({
    name: z.string().min(1, 'Le nom est requis'),
    description: z.string(),
    start_date: z.date(),
    end_date: z.date(),
});

type PhaseFormData = z.infer<typeof phaseSchema>;

interface ProjectPhasesProps {
    projectId: string;
}

export function ProjectPhases({ projectId }: ProjectPhasesProps) {
    const {
        phases,
        createPhase,
        updatePhase,
        reorderPhase,
        loading,
    } = useProjectLifecycle(projectId);
    
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedPhase, setSelectedPhase] = useState<Phase | null>(null);
    
    const form = useForm<PhaseFormData>({
        resolver: zodResolver(phaseSchema),
        defaultValues: {
            name: '',
            description: '',
            start_date: new Date(),
            end_date: new Date(),
        },
    });
    
    const onSubmit = async (data: PhaseFormData) => {
        if (selectedPhase) {
            await updatePhase(selectedPhase.id, {
                ...data,
                start_date: format(data.start_date, 'yyyy-MM-dd'),
                end_date: format(data.end_date, 'yyyy-MM-dd'),
            });
        } else {
            const newPhase: Omit<Phase, 'id'> = {
                name: data.name,
                description: data.description,
                start_date: format(data.start_date, 'yyyy-MM-dd'),
                end_date: format(data.end_date, 'yyyy-MM-dd'),
                progress: 0,
                order: phases.length,
                project: projectId
            };
            await createPhase(newPhase);
        }
        setIsDialogOpen(false);
        form.reset();
    };
    
    const handleEdit = (phase: Phase) => {
        setSelectedPhase(phase);
        form.reset({
            name: phase.name,
            description: phase.description,
            start_date: new Date(phase.start_date),
            end_date: new Date(phase.end_date),
        });
        setIsDialogOpen(true);
    };
    
    const handleDragEnd = async (result: any) => {
        if (!result.destination) return;
        
        const phaseId = parseInt(result.draggableId);
        const newOrder = result.destination.index;
        
        await reorderPhase(phaseId, newOrder);
    };
    
    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Phases du projet</h2>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button
                            onClick={() => {
                                setSelectedPhase(null);
                                form.reset();
                            }}
                        >
                            Ajouter une phase
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[700px]" style={{ zIndex: 9999, pointerEvents: 'auto' }}>
                        <DialogHeader>
                            <DialogTitle>
                                {selectedPhase ? 'Modifier la phase' : 'Nouvelle phase'}
                            </DialogTitle>
                        </DialogHeader>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nom</FormLabel>
                                            <FormControl>
                                                <Input {...field} />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Description</FormLabel>
                                            <FormControl>
                                                <Textarea {...field} />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="start_date"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Date de début</FormLabel>
                                                <FormControl>
                                                    <Calendar
                                                        mode="single"
                                                        selected={field.value}
                                                        onSelect={field.onChange}
                                                        initialFocus
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="end_date"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Date de fin</FormLabel>
                                                <FormControl>
                                                    <Calendar
                                                        mode="single"
                                                        selected={field.value}
                                                        onSelect={field.onChange}
                                                        initialFocus
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <Button type="submit" className="w-full">
                                    {selectedPhase ? 'Mettre à jour' : 'Créer'}
                                </Button>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
            </div>
            
            <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="phases">
                    {(provided) => (
                        <div
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                            className="space-y-4"
                        >
                            {phases.map((phase, index) => (
                                <Draggable
                                    key={phase.id}
                                    draggableId={phase.id.toString()}
                                    index={index}
                                >
                                    {(provided) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            {...provided.dragHandleProps}
                                        >
                                            <Card>
                                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                                    <CardTitle className="text-sm font-medium">
                                                        {phase.name}
                                                    </CardTitle>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleEdit(phase)}
                                                    >
                                                        Modifier
                                                    </Button>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="text-xs text-muted-foreground">
                                                        {format(new Date(phase.start_date), 'dd/MM/yyyy')} - {format(new Date(phase.end_date), 'dd/MM/yyyy')}
                                                    </div>
                                                    <Progress
                                                        value={phase.progress}
                                                        className="mt-2"
                                                    />
                                                    <p className="mt-2 text-sm">
                                                        {phase.description}
                                                    </p>
                                                </CardContent>
                                            </Card>
                                        </div>
                                    )}
                                </Draggable>
                            ))}
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
            </DragDropContext>
        </div>
    );
} 