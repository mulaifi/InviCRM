import { useParams, useNavigate } from 'react-router';
import {
  ArrowLeft,
  Mail,
  Phone,
  Building2,
  Briefcase,
  Calendar,
  Linkedin,
  MoreVertical,
  Pencil,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
import { useContact, useDeleteContact } from '@/hooks/useContacts';
import { formatDate, getInitials, formatCurrency } from '@/lib/utils';
import { ActivityTimeline } from '@/components/activities/ActivityTimeline';

export function ContactDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: contact, isLoading } = useContact(id!);
  const deleteMutation = useDeleteContact();

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this contact?')) {
      await deleteMutation.mutateAsync(id!);
      navigate('/contacts');
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

  if (!contact) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <h2 className="text-lg font-medium text-cool-dark">Contact not found</h2>
        <Button onClick={() => navigate('/contacts')} variant="link">
          Back to contacts
        </Button>
      </div>
    );
  }

  const fullName = `${contact.firstName} ${contact.lastName}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/contacts')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Avatar className="h-12 w-12">
            <AvatarFallback className="text-lg">{getInitials(fullName)}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-semibold text-cool-dark">{fullName}</h1>
            {contact.title && contact.company && (
              <p className="text-sm text-grey">
                {contact.title} at {contact.company.name}
              </p>
            )}
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
              <DropdownMenuItem
                onClick={handleDelete}
                className="text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Contact
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Sidebar - Contact Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {contact.email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-grey" />
                  <a
                    href={`mailto:${contact.email}`}
                    className="text-sm text-brand-violet hover:underline"
                  >
                    {contact.email}
                  </a>
                </div>
              )}
              {contact.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-grey" />
                  <a
                    href={`tel:${contact.phone}`}
                    className="text-sm text-brand-violet hover:underline"
                  >
                    {contact.phone}
                  </a>
                </div>
              )}
              {contact.company && (
                <div className="flex items-center gap-3">
                  <Building2 className="h-4 w-4 text-grey" />
                  <span className="text-sm">{contact.company.name}</span>
                </div>
              )}
              {contact.title && (
                <div className="flex items-center gap-3">
                  <Briefcase className="h-4 w-4 text-grey" />
                  <span className="text-sm">{contact.title}</span>
                </div>
              )}
              {contact.linkedInUrl && (
                <div className="flex items-center gap-3">
                  <Linkedin className="h-4 w-4 text-grey" />
                  <a
                    href={contact.linkedInUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-brand-violet hover:underline"
                  >
                    LinkedIn Profile
                  </a>
                </div>
              )}
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-grey" />
                <span className="text-sm text-grey">
                  Added {formatDate(contact.createdAt)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Associated Deals */}
          {contact.deals.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Deals</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {contact.deals.map((deal) => (
                  <button
                    key={deal.id}
                    onClick={() => navigate(`/deals/${deal.id}`)}
                    className="w-full rounded-lg border border-brand-violet-light/50 p-3 text-left transition-colors hover:bg-flash-white"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-cool-dark">{deal.title}</span>
                      <Badge variant="secondary">{deal.stage}</Badge>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-sm">
                      <span className="text-grey">
                        {formatCurrency(deal.value, deal.currency)}
                      </span>
                      <span className="text-grey">{deal.probability}%</span>
                    </div>
                  </button>
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
                  <TabsTrigger value="emails">Emails</TabsTrigger>
                </TabsList>
              </CardHeader>
              <CardContent className="pt-6">
                <TabsContent value="activity" className="mt-0">
                  {contact.activities.length > 0 ? (
                    <ActivityTimeline activities={contact.activities} />
                  ) : (
                    <div className="py-8 text-center text-sm text-grey">
                      No activity recorded yet
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="notes" className="mt-0">
                  {contact.notes ? (
                    <div className="prose prose-sm max-w-none">
                      <p className="text-cool-dark whitespace-pre-wrap">{contact.notes}</p>
                    </div>
                  ) : (
                    <div className="py-8 text-center text-sm text-grey">
                      No notes added yet
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="emails" className="mt-0">
                  <div className="py-8 text-center text-sm text-grey">
                    Email sync coming soon
                  </div>
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>
        </div>
      </div>
    </div>
  );
}
