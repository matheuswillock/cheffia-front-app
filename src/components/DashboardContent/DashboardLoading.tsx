export default function DashboardLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h2 className="text-2xl font-semibold text-primary mb-4">Carregando as informações do restaurante</h2>
      <div className="flex space-x-2">
        <div className="w-4 h-4 bg-primary rounded-full animate-pulse"></div>
        <div className="w-4 h-4 bg-primary rounded-full animate-pulse delay-150"></div>
        <div className="w-4 h-4 bg-primary rounded-full animate-pulse delay-300"></div>
      </div>
    </div>
  );
}