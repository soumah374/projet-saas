import { useQuery } from '@tanstack/react-query';

interface BackendStatusResponse {
  isOnline: boolean;
  error?: string;
  details?: any;
}

export const useBackendStatus = () => {
  return useQuery<BackendStatusResponse>({
    queryKey: ['backend-status'],
    queryFn: async (): Promise<BackendStatusResponse> => {
      try {
        const response = await fetch('http://localhost:8000/api/v1/health/', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          // Add timeout to prevent hanging requests
          signal: AbortSignal.timeout(5000), // 5 second timeout
        });
        
        if (response.ok) {
          const healthData = await response.json();
          return { 
            isOnline: healthData.status === 'healthy',
            error: healthData.status === 'unhealthy' ? 'Backend unhealthy' : undefined,
            details: healthData
          };
        } else {
          return { 
            isOnline: false, 
            error: `HTTP ${response.status}: ${response.statusText}` 
          };
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.log('Backend not accessible:', errorMessage);
        return { 
          isOnline: false, 
          error: errorMessage 
        };
      }
    },
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    staleTime: 30000, // 30 seconds
    gcTime: 60000, // 1 minute (formerly cacheTime)
    // Don't refetch if the window is not focused
    refetchOnReconnect: true,
  });
}; 