import { useMemo } from 'react';
import type { TeamMember } from '@/lib/types';

export interface TeamStats {
  totalMembers: number;
  leaders: number;
  members: number;
  consultants: number;
  roleDistribution: Array<{ role: string; count: number; percentage: number }>;
}

export function useTeamStats(members: TeamMember[] = []): TeamStats {
  return useMemo(() => {
    const totalMembers = members.length;
    const leaders = members.filter(m => m.role === 'leader').length;
    const regularMembers = members.filter(m => m.role === 'member').length;
    const consultants = members.filter(m => m.role === 'consultant').length;

    const roleDistribution = [
      {
        role: 'Leaders',
        count: leaders,
        percentage: totalMembers > 0 ? Math.round((leaders / totalMembers) * 100) : 0
      },
      {
        role: 'Membres',
        count: regularMembers,
        percentage: totalMembers > 0 ? Math.round((regularMembers / totalMembers) * 100) : 0
      },
      {
        role: 'Consultants',
        count: consultants,
        percentage: totalMembers > 0 ? Math.round((consultants / totalMembers) * 100) : 0
      }
    ];

    return {
      totalMembers,
      leaders,
      members: regularMembers,
      consultants,
      roleDistribution
    };
  }, [members]);
} 