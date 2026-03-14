import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="container mx-auto p-4">
      <Card className="mt-16 rounded-xl shadow-md drop-shadow-4xl shadow-sidebar-primary-foreground">
        <CardHeader>
          <Skeleton className="h-8 w-40" />
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-2">
            <div className="rounded-xl border-4 border-border-default p-4">
              <div className="flex flex-col gap-4">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="grid grid-cols-4 gap-4 rounded-xl border border-border-default p-4">
                    <Skeleton className="col-span-1 h-32 w-full rounded-xl" />
                    <div className="col-span-2 flex flex-col gap-3">
                      <Skeleton className="h-7 w-2/3" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-5/6" />
                      <Skeleton className="h-6 w-24" />
                    </div>
                    <div className="col-span-1 flex flex-col items-end gap-2">
                      <Skeleton className="h-10 w-24 rounded-xl" />
                      <Skeleton className="h-10 w-24 rounded-xl" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-4 rounded-xl border-4 border-muted-fore p-4">
              <Skeleton className="h-8 w-44" />
              <div className="space-y-4">
                <Skeleton className="h-10 w-full rounded-lg" />
                <Skeleton className="h-10 w-full rounded-lg" />
                <Skeleton className="h-10 w-full rounded-lg" />
                <Skeleton className="h-10 w-full rounded-lg" />
                <Skeleton className="h-32 w-full rounded-lg" />
                <Skeleton className="h-12 w-40 rounded-xl" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

