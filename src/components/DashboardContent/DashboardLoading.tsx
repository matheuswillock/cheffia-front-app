import { Loader2 } from "lucide-react"

export default function DashboardLoading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background-default">
      <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
      <h2 className="mb-2 text-2xl font-semibold text-foreground-default">Carregando informações</h2>
      <p className="text-center text-muted-foreground">Estamos preparando seu dashboard, aguarde um momento...</p>
    </div>
  )
}

