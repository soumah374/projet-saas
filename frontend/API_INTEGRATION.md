# API Integration Documentation

## Overview

The ProjectManagement page has been successfully integrated with the Django REST API backend using React Query for efficient data fetching and caching.

## Features Implemented

### 1. React Query Setup

- QueryClient configured with 5-minute stale time
- Automatic retry on failure (1 retry)
- Error boundary for graceful error handling

### 2. API Service Layer (`src/lib/api.ts`)

- Type-safe API functions using TypeScript interfaces
- Centralized API configuration
- Error handling with proper error messages
- Support for all CRUD operations on projects

### 3. React Query Hooks (`src/hooks/use-projects.ts`)

- `useProjects()` - Fetch projects with filtering
- `useProject()` - Fetch single project
- `useProjectStatistics()` - Fetch project statistics
- `useCreateProject()` - Create new project
- `useUpdateProject()` - Update existing project
- `useDeleteProject()` - Delete project
- `useUpdateProjectProgress()` - Update project progress
- `useAddProjectMember()` - Add team member
- `useRemoveProjectMember()` - Remove team member

### 4. Updated Components

- **ProjectManagement**: Now uses real API data instead of mock data
- **ProjectCard**: Updated to work with new API structure
- **CreateProjectModal**: Updated to send properly formatted data to API

## API Endpoints Used

- `GET /api/v1/projects/` - List projects with filtering
- `GET /api/v1/projects/{id}/` - Get single project
- `POST /api/v1/projects/` - Create new project
- `PATCH /api/v1/projects/{id}/` - Update project
- `DELETE /api/v1/projects/{id}/` - Delete project
- `GET /api/v1/projects/statistics/` - Get project statistics
- `POST /api/v1/projects/{id}/update_progress/` - Update progress
- `POST /api/v1/projects/{id}/add_member/` - Add team member
- `DELETE /api/v1/projects/{id}/remove_member/` - Remove team member

## Configuration

### Environment Variables

Create a `.env` file in the frontend directory:

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

### Default Configuration

If no environment variable is set, the app defaults to `http://localhost:8000/api/v1`.

## Usage Examples

### Fetching Projects

```typescript
const {
  data: projects,
  isLoading,
  error,
} = useProjects({
  search: "search term",
  status: "En cours",
  type: "Événementiel",
});
```

### Creating a Project

```typescript
const createProject = useCreateProject();

const handleCreate = async () => {
  try {
    await createProject.mutateAsync({
      title: "New Project",
      description: "Project description",
      type: "Événementiel",
      status: "Planification",
      priority: "Normale",
      deadline: "2024-12-31",
      budget: "25000",
      client: "Client Name",
    });
    toast.success("Project created successfully");
  } catch (error) {
    toast.error("Failed to create project");
  }
};
```

### Updating Project Progress

```typescript
const updateProgress = useUpdateProjectProgress();

const handleProgressUpdate = async (projectId: string, progress: number) => {
  await updateProgress.mutateAsync({ id: projectId, progress });
};
```

## Error Handling

- **Network Errors**: Displayed with toast notifications
- **API Errors**: Handled gracefully with retry options
- **Loading States**: Shown with spinner components
- **Error Boundary**: Catches unexpected errors and provides recovery options

## Data Types

### Project Interface

```typescript
interface Project {
  id: string;
  title: string;
  description: string;
  type: string;
  status: string;
  priority: string;
  progress: number;
  deadline: string;
  budget: string;
  client: string;
  created_by: User;
  team_members: ProjectMember[];
  // ... other fields
}
```

### CreateProjectData Interface

```typescript
interface CreateProjectData {
  title: string;
  description: string;
  type: string;
  status: string;
  priority: string;
  deadline: string;
  budget: string;
  client: string;
  // ... optional fields
}
```

## Caching Strategy

- **Project Lists**: 5-minute stale time
- **Project Details**: 5-minute stale time
- **Statistics**: 10-minute stale time
- **Automatic Invalidation**: When projects are created, updated, or deleted

## Performance Optimizations

- **Optimistic Updates**: UI updates immediately, then syncs with server
- **Background Refetching**: Data is refreshed in the background
- **Selective Invalidation**: Only relevant queries are invalidated
- **Debounced Search**: Search queries are debounced to reduce API calls

## Testing the Integration

1. Start the Django backend server
2. Start the React frontend development server
3. Navigate to the ProjectManagement page
4. Test creating, viewing, and updating projects
5. Verify that data persists and syncs correctly

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure Django CORS settings are configured correctly
2. **API Connection**: Verify the API base URL is correct
3. **Authentication**: Ensure proper authentication headers are sent
4. **Data Format**: Check that data sent to API matches expected format

### Debug Mode

Enable debug logging by setting:

```typescript
// In src/lib/api.ts
console.log("API call:", url, options);
```

## Future Enhancements

- [ ] Real-time updates using WebSockets
- [ ] Offline support with service workers
- [ ] Advanced filtering and sorting
- [ ] Bulk operations
- [ ] Export functionality
- [ ] Advanced search with full-text search
