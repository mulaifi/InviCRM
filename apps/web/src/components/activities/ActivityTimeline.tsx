import { Mail, Phone, Calendar, FileText, CheckSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatRelativeTime } from '@/lib/utils';

interface Activity {
  id: string;
  type: 'email' | 'call' | 'meeting' | 'note' | 'task';
  subject: string;
  description?: string | null;
  occurredAt: string;
  direction?: 'inbound' | 'outbound' | null;
}

interface ActivityTimelineProps {
  activities: Activity[];
}

const activityIcons: Record<Activity['type'], React.ElementType> = {
  email: Mail,
  call: Phone,
  meeting: Calendar,
  note: FileText,
  task: CheckSquare,
};

const activityColors: Record<Activity['type'], string> = {
  email: 'bg-cyan/10 text-cyan',
  call: 'bg-green/10 text-green',
  meeting: 'bg-brand-violet/10 text-brand-violet',
  note: 'bg-gold/10 text-gold',
  task: 'bg-magenta/10 text-magenta',
};

export function ActivityTimeline({ activities }: ActivityTimelineProps) {
  return (
    <div className="space-y-4">
      {activities.map((activity, index) => {
        const Icon = activityIcons[activity.type];
        const isLast = index === activities.length - 1;

        return (
          <div key={activity.id} className="relative flex gap-4">
            {/* Timeline line */}
            {!isLast && (
              <div className="absolute left-5 top-10 h-full w-px bg-brand-violet-light/50" />
            )}

            {/* Icon */}
            <div
              className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                activityColors[activity.type]
              )}
            >
              <Icon className="h-4 w-4" />
            </div>

            {/* Content */}
            <div className="flex-1 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-cool-dark">{activity.subject}</span>
                  {activity.direction && (
                    <span className="text-xs text-grey">
                      ({activity.direction})
                    </span>
                  )}
                </div>
                <span className="text-xs text-grey">
                  {formatRelativeTime(activity.occurredAt)}
                </span>
              </div>
              {activity.description && (
                <p className="mt-1 text-sm text-grey line-clamp-2">
                  {activity.description}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
