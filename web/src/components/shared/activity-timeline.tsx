interface ActivityItem {
  id: string;
  type: string;
  body: string | null;
  occurred_at: string;
  actorEmail: string | null;
}

// A real vertical rail + dot per entry, matching the treatment on the
// dashboard's ActivityFeed, used on 5 detail pages (contacts, companies,
// deals, tasks, tickets).
export function ActivityTimeline({ activities }: { activities: ActivityItem[] }) {
  if (activities.length === 0) {
    return <p className="text-sm text-text-2">No activity yet.</p>;
  }

  return (
    <ul className="relative flex flex-col gap-5 pl-5">
      <div className="absolute bottom-1 left-[3px] top-1 w-px bg-line" />
      {activities.map((activity) => (
        <li key={activity.id} className="relative">
          <span className="absolute -left-5 top-1 size-1.5 rounded-full bg-brand ring-4 ring-bg" />
          <div className="flex items-center justify-between gap-2 text-xs text-text-3">
            <span className="capitalize">{activity.type}</span>
            <span>{new Date(activity.occurred_at).toLocaleString()}</span>
          </div>
          {activity.body && (
            <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{activity.body}</p>
          )}
          {activity.actorEmail && (
            <p className="mt-1 text-xs text-text-3">by {activity.actorEmail}</p>
          )}
        </li>
      ))}
    </ul>
  );
}
