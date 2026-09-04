interface ActivityItem {
  id: string;
  type: string;
  body: string | null;
  occurred_at: string;
  actorEmail: string | null;
}

export function ActivityTimeline({ activities }: { activities: ActivityItem[] }) {
  if (activities.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No activity yet.</p>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {activities.map((activity) => (
        <li key={activity.id} className="rounded-md border border-border bg-background p-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="capitalize">{activity.type}</span>
            <span>{new Date(activity.occurred_at).toLocaleString()}</span>
          </div>
          {activity.body && (
            <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">
              {activity.body}
            </p>
          )}
          {activity.actorEmail && (
            <p className="mt-1 text-xs text-muted-foreground">
              by {activity.actorEmail}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}
