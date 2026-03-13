import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="mx-auto max-w-6xl space-y-6 p-6 md:p-8">
      <section className="space-y-3">
        <Skeleton className="h-4 w-44" />
        <Skeleton className="h-10 w-52" />
        <Skeleton className="h-4 w-3/4" />
      </section>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="rounded-xl border-border-default bg-card shadow-md">
            <CardContent className="space-y-3 p-6">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-28" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="rounded-xl border-border-default bg-card shadow-md">
        <CardContent className="space-y-4 p-6">
          <Skeleton className="h-6 w-44" />
          <div className="grid gap-3 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-20 w-full rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-20 w-full rounded-xl" />
        </CardContent>
      </Card>

      <Card className="rounded-xl border-border-default bg-card shadow-md">
        <CardContent className="space-y-3 p-6">
          <Skeleton className="h-7 w-72" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-28 w-full rounded-xl" />
        </CardContent>
      </Card>
    </main>
  );
}

