import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="flex flex-1 flex-col gap-8 p-4 md:p-4 lg:px-6 lg:py-8">
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-10 w-28 rounded-md" />
      </div>

      <div className="mx-auto w-full max-w-7xl space-y-8">
        <section className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="rounded-xl border border-border-default bg-card p-6 shadow-md">
                <Skeleton className="h-4 w-28" />
                <div className="mt-6 flex items-center justify-between">
                  <Skeleton className="h-8 w-36" />
                  <Skeleton className="h-5 w-12" />
                </div>
                <Skeleton className="mt-4 h-3 w-40" />
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <Skeleton className="h-8 w-56" />
          <div className="rounded-xl border border-border-default bg-card p-6 shadow-md">
            <Skeleton className="h-32 w-full rounded-lg" />
          </div>
        </section>
      </div>
    </div>
  );
}
