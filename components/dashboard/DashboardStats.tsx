type Stat = {
  label: string;
  value: string | number;
  accent: string;
};

export function DashboardStats({ stats }: { stats: Stat[] }) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.label} className="overflow-hidden rounded-xl border border-lp-border bg-lp-surface">
          <div className={`h-0.5 ${stat.accent}`} />
          <div className="p-5">
            <p className="text-sm font-medium text-lp-text2">{stat.label}</p>
            <p className="mt-3 font-heading text-3xl font-bold text-lp-text">{stat.value}</p>
          </div>
        </div>
      ))}
    </section>
  );
}
