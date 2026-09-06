import Link from "next/link";

interface ActivityDatum {
  id: string;
  body: string | null;
  type: string;
  occurredAt: string;
  subject: string | null;
  href?: string;
}

// Replaces the plain <ul> of activity rows with a real vertical rail,
// a connecting line and a dot per entry, standard editorial-timeline
// treatment. Dashboard-specific for now (the shared ActivityTimeline used
// on 5 detail pages gets its own pass in the detail-pages phase, since
// its layout needs differ from this one).
export function ActivityFeed({ activities }: { activities: ActivityDatum[] }) {
  if (activities.length === 0) {
    return <p className="text-sm text-text-2">Nothing yet.</p>;
  }

  return (
    <ul className="relative flex flex-col gap-5 pl-5">
      <div className="absolute left-[3px] top-1 bottom-1 w-px bg-line" />
      {activities.map((activity) => (
        <li key={activity.id} className="relative">
          <span className="absolute -left-5 top-1 size-1.5 rounded-full bg-brand ring-4 ring-bg" />
          <p className="text-sm text-foreground">{activity.body ?? `${activity.type} logged`}</p>
          <p className="mt-0.5 text-xs text-text-3">
            {activity.subject && activity.href ? (
              <Link href={activity.href} className="hover:underline">
                {activity.subject}
              </Link>
            ) : null}
            {activity.subject ? " · " : ""}
            {new Date(activity.occurredAt).toLocaleString()}
          </p>
        </li>
      ))}
    </ul>
  );
}
