import { useQuery } from '@tanstack/react-query';
import { Plus, Mail, MoreVertical, Shield, User } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { apiClient } from '@/api/client';
import { getInitials } from '@/lib/utils';

interface TeamMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'admin' | 'manager' | 'member';
  status: 'active' | 'pending';
  joinedAt: string;
}

const roleColors: Record<string, string> = {
  admin: 'bg-brand-violet/10 text-brand-violet',
  manager: 'bg-cyan/10 text-cyan',
  member: 'bg-grey/10 text-grey',
};

export function TeamSettings() {
  const { data: members, isLoading } = useQuery({
    queryKey: ['team', 'members'],
    queryFn: async () => {
      const response = await apiClient.get<TeamMember[]>('/team/members');
      return response.data;
    },
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Team Members</CardTitle>
            <CardDescription>
              Manage your team and their permissions
            </CardDescription>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Invite Member
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {members?.map((member) => {
                const fullName = `${member.firstName} ${member.lastName}`;
                const RoleIcon = member.role === 'admin' ? Shield : User;

                return (
                  <div
                    key={member.id}
                    className="flex items-center justify-between rounded-lg border border-brand-violet-light/50 p-4"
                  >
                    <div className="flex items-center gap-4">
                      <Avatar>
                        <AvatarFallback>{getInitials(fullName)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-cool-dark">
                            {fullName}
                          </span>
                          <Badge variant="secondary" className={roleColors[member.role]}>
                            <RoleIcon className="mr-1 h-3 w-3" />
                            {member.role}
                          </Badge>
                          {member.status === 'pending' && (
                            <Badge variant="outline" className="text-gold">
                              Pending
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-grey">
                          <Mail className="h-3 w-3" />
                          {member.email}
                        </div>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Change Role</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">
                          Remove from Team
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                );
              })}
              {!members?.length && (
                <div className="py-8 text-center text-sm text-grey">
                  No team members yet. Invite your first team member to get started.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
