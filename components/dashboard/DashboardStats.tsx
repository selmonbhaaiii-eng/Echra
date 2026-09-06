type Stat = {
  label: string;
  value: string | number;
  accent: string;
};

export function DashboardStats({ stats }: { stats: Stat[] }) {
  return (
    <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.label} className="overflow-hidden rounded-xl border border-lp-border bg-lp-surface">
          <div className={`h-0.5 ${stat.accent}`} />
          <div className="p-3.5 sm:p-5">
            <p className="text-xs sm:text-sm font-medium text-lp-text2 truncate">{stat.label}</p>
            <p className="mt-2 sm:mt-3 font-heading text-2xl sm:text-3xl font-bold text-lp-text truncate">{stat.value}</p>
          </div>
        </div>
      ))}
    </section>
  );
}
