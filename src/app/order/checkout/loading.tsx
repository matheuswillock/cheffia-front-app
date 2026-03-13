import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-4 py-8 md:px-6 lg:flex-row lg:items-start">
      <Card className="w-full lg:max-w-xl">
        <CardHeader className="space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-10 w-80" />
          <Skeleton className="h-4 w-full" />
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-20 w-full md:col-span-2" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full md:col-span-2" />
          </div>
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-11 w-full rounded-xl" />
        </CardContent>
      </Card>

      <Card className="w-full">
        <CardHeader className="space-y-2">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-full" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-56 w-full rounded-2xl" />
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </CardContent>
      </Card>
    </main>
  );
}

