import Skeleton from "@/components/smoothui/skeleton"

export default function AuthLoading() {
  return <main className="grid min-h-svh w-full bg-background-default lg:grid-cols-[minmax(0,1.08fr)_minmax(420px,0.92fr)]" role="status" aria-label="Carregando acesso" aria-busy="true">
    <section className="hidden min-h-svh flex-col justify-between bg-background-missionAndValues px-12 py-10 lg:flex" aria-hidden="true">
      <Skeleton className="h-11 w-40" />
      <div className="w-full max-w-2xl space-y-6">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-24 w-4/5" />
        <Skeleton className="aspect-[1.75/1] w-full" />
      </div>
    </section>
    <section className="flex min-h-svh items-center justify-center px-6 pb-10 pt-24 sm:px-10 lg:border-l lg:border-border-default lg:px-12" aria-hidden="true">
      <div className="w-full max-w-md space-y-8">
        <Skeleton className="h-9 w-3/4" />
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    </section>
    <span className="sr-only">Carregando acesso</span>
  </main>
}
