import { Zap, MessageSquare, Calendar, TrendingUp } from "lucide-react";

export type Activity = {
  id: string;
  type: "post_published" | "post_drafted" | "review" | "rank";
  title: string;
  time: string;
  subtitle?: string;
};

export function RecentActivity({ activities = [] }: { activities?: Activity[] }) {
  const getIcon = (type: string) => {
    switch (type) {
      case "post_published":
        return (
          <div className="flex size-7 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
            <Zap className="size-4" />
          </div>
        );
      case "review":
        return (
          <div className="flex size-7 flex-shrink-0 items-center justify-center rounded-lg bg-orange-500/10 text-orange-500">
            <MessageSquare className="size-4" />
          </div>
        );
      case "post_drafted":
        return (
          <div className="flex size-7 flex-shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
            <Calendar className="size-4" />
          </div>
        );
      case "rank":
        return (
          <div className="flex size-7 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
            <TrendingUp className="size-4" />
          </div>
        );
      default:
        return (
          <div className="flex size-7 flex-shrink-0 items-center justify-center rounded-lg bg-gray-500/10 text-gray-500">
            <Zap className="size-4" />
          </div>
        );
    }
  };

  return (
    <div className="rounded-xl border border-lp-border bg-lp-surface p-6">
      <h2 className="mb-4 font-heading text-xl font-bold text-lp-text">Recent Activity</h2>
      
      <div className="space-y-4">
        {activities.length > 0 ? (
          activities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-3 border-b border-lp-border pb-4 last:border-0 last:pb-0">
              {getIcon(activity.type)}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-lp-text truncate">
                  {activity.title}
                </div>
                <div className="mt-1 text-xs text-lp-text3">
                  {activity.time}
                  {activity.subtitle && (
                    <>
                      {" · "}
                      <span>{activity.subtitle}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-lp-text3">No recent activity.</p>
        )}
      </div>
    </div>
  );
}
