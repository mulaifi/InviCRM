import { useParams, useNavigate } from 'react-router';
import {
  ArrowLeft,
  DollarSign,
  User,
  Building2,
  Calendar,
  MoreVertical,
  Pencil,
  Trash2,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useDeal, useDeleteDeal } from '@/hooks/useDeals';
import { formatDate, formatCurrency } from '@/lib/utils';
import { ActivityTimeline } from '@/components/activities/ActivityTimeline';

export function DealDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: deal, isLoading } = useDeal(id!);
  const deleteMutation = useDeleteDeal();

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this deal?')) {
      await deleteMutation.mutateAsync(id!);
      navigate('/deals');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-64 lg:col-span-1" />
          <Skeleton className="h-64 lg:col-span-2" />
        </div>
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <h2 className="text-lg font-medium text-cool-dark">Deal not found</h2>
        <Button onClick={() => navigate('/deals')} variant="link">
          Back to deals
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/deals')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-cool-dark">{deal.title}</h1>
              <Badge
                style={{ backgroundColor: deal.stage.color + '20', color: deal.stage.color }}
              >
                {deal.stage.name}
              </Badge>
            </div>
            <p className="text-sm text-grey">
              {deal.pipeline.name} • {deal.probability}% probability
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Add Note</DropdownMenuItem>
              <DropdownMenuItem>Log Activity</DropdownMenuItem>
              <DropdownMenuItem>Create Task</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Deal
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Sidebar - Deal Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Deal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <DollarSign className="h-4 w-4 text-grey" />
                <div>
                  <span className="text-lg font-semibold text-cool-dark">
                    {formatCurrency(deal.value, deal.currency)}
                  </span>
                </div>
              </div>
              {deal.contact && (
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-grey" />
                  <button
                    onClick={() => navigate(`/contacts/${deal.contact!.id}`)}
                    className="text-sm text-brand-violet hover:underline"
                  >
                    {deal.contact.firstName} {deal.contact.lastName}
                  </button>
                </div>
              )}
              {deal.company && (
                <div className="flex items-center gap-3">
                  <Building2 className="h-4 w-4 text-grey" />
                  <span className="text-sm">{deal.company.name}</span>
                </div>
              )}
              {deal.expectedCloseDate && (
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-grey" />
                  <span className="text-sm">
                    Expected close: {formatDate(deal.expectedCloseDate)}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-grey" />
                <span className="text-sm text-grey">
                  Owner: {deal.owner.firstName} {deal.owner.lastName}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Tasks */}
          {deal.tasks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Tasks</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {deal.tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 rounded-lg p-2 hover:bg-flash-white"
                  >
                    <CheckCircle2
                      className={`h-5 w-5 ${
                        task.isCompleted ? 'text-green' : 'text-grey'
                      }`}
                    />
                    <div className="flex-1">
                      <p
                        className={`text-sm ${
                          task.isCompleted
                            ? 'text-grey line-through'
                            : 'text-cool-dark'
                        }`}
                      >
                        {task.title}
                      </p>
                      {task.dueDate && (
                        <p className="text-xs text-grey">
                          Due: {formatDate(task.dueDate)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2">
          <Card>
            <Tabs defaultValue="activity">
              <CardHeader className="pb-0">
                <TabsList>
                  <TabsTrigger value="activity">Activity</TabsTrigger>
                  <TabsTrigger value="notes">Notes</TabsTrigger>
                </TabsList>
              </CardHeader>
              <CardContent className="pt-6">
                <TabsContent value="activity" className="mt-0">
                  {deal.activities.length > 0 ? (
                    <ActivityTimeline
                      activities={deal.activities.map((a) => ({
                        ...a,
                        type: a.type as 'email' | 'call' | 'meeting' | 'note' | 'task',
                      }))}
                    />
                  ) : (
                    <div className="py-8 text-center text-sm text-grey">
                      No activity recorded yet
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="notes" className="mt-0">
                  {deal.description ? (
                    <div className="prose prose-sm max-w-none">
                      <p className="text-cool-dark whitespace-pre-wrap">{deal.description}</p>
                    </div>
                  ) : (
                    <div className="py-8 text-center text-sm text-grey">
                      No notes added yet
                    </div>
                  )}
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>
        </div>
      </div>
    </div>
  );
}
