import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Crown, Shield, Activity } from "lucide-react";
import type { TeamMemberRole } from '@/lib/types';

interface TeamStatsCardProps {
  totalMembers: number;
  leaders: number;
  members: number;
  consultants: number;
  activeProjects?: number;
}

export function TeamStatsCard({ 
  totalMembers, 
  leaders, 
  members, 
  consultants, 
  activeProjects = 0 
}: TeamStatsCardProps) {
  const stats = [
    {
      label: "Total membres",
      value: totalMembers,
      icon: Users,
      color: "text-blue-600"
    },
    {
      label: "Leaders",
      value: leaders,
      icon: Crown,
      color: "text-yellow-600"
    },
    {
      label: "Membres",
      value: members,
      icon: Shield,
      color: "text-green-600"
    },
    {
      label: "Consultants",
      value: consultants,
      icon: Activity,
      color: "text-purple-600"
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Statistiques de l'équipe</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-gray-100 ${stat.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                </div>
              </div>
            );
          })}
        </div>
        {activeProjects > 0 && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Projets actifs</span>
              <Badge variant="outline" className="bg-green-50 text-green-700">
                {activeProjects}
              </Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 