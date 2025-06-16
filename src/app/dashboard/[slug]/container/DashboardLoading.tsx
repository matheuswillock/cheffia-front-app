import { Loader2 } from "lucide-react"
import { useEffect, useState } from "react";

export default function DashboardLoading() {
  return (
    <div className="w-screen flex min-h-screen flex-col items-center justify-center bg-background-default-default">
      <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
      <h2 className="mb-2 text-2xl font-semibold text-foreground-default">Carregando informações</h2>
      <p className="text-center text-muted-foreground">Estamos preparando seu dashboard, aguarde um momento...</p>
    </div>
  )
}


// TODO: Reavaliar a animação do loading
// SVG do seu logo (copie o path do SVG real se quiser mais fidelidade)
// const LogoSVG = (
//   <svg width="120" height="120" viewBox="0 0 768 768" fill="none">
//     <path d="M128 384c0-141.4 114.6-256 256-256 35.3 0 64-28.7 64-64s-28.7-64-64-64C153.3 0 0 153.3 0 384s153.3 384 384 384c230.7 0 384-153.3 384-384 0-35.3-28.7-64-64-64s-64 28.7-64 64c0 141.4-114.6 256-256 256S128 525.4 128 384Z" fill="#00FF99"/>
//     <circle cx="640" cy="160" r="48" fill="#00FF99"/>
//     <circle cx="640" cy="320" r="64" fill="#00FF99"/>
//     <polyline points="256,448 384,576 576,352" stroke="#00FF99" strokeWidth="64" fill="none" strokeLinecap="round"/>
//   </svg>
// );

// const steps = [
//   // Etapa 1: ponto
//   <svg key={0} width="120" height="120" viewBox="0 0 120 120">
//     <circle cx="60" cy="60" r="10" fill="#00FF99" />
//   </svg>,
//   // Etapa 2: meia lua e pontos
//   <svg key={1} width="120" height="120" viewBox="0 0 120 120">
//     <path d="M30 80 Q60 110 90 80" stroke="#00FF99" strokeWidth="10" fill="none" strokeLinecap="round"/>
//     <circle cx="90" cy="60" r="8" fill="#00FF99" />
//     <circle cx="90" cy="40" r="8" fill="#00FF99" />
//     <circle cx="60" cy="30" r="8" fill="#00FF99" />
//   </svg>,
//   // Etapa 3: círculo quase completo e pontos
//   <svg key={2} width="120" height="120" viewBox="0 0 120 120">
//     <path d="M30 80 Q60 110 90 80 Q110 60 90 40 Q60 10 30 40" stroke="#00FF99" strokeWidth="10" fill="none" strokeLinecap="round"/>
//     <circle cx="90" cy="60" r="8" fill="#00FF99" />
//     <circle cx="90" cy="40" r="8" fill="#00FF99" />
//     <polyline points="60,60 80,80 100,60" stroke="#00FF99" strokeWidth="8" fill="none" strokeLinecap="round"/>
//   </svg>,
//   // Etapa 4: círculo completo com check
//   <svg key={3} width="120" height="120" viewBox="0 0 120 120">
//     <circle cx="60" cy="60" r="50" stroke="#00FF99" strokeWidth="10" fill="none"/>
//     <circle cx="90" cy="60" r="8" fill="#00FF99" />
//     <circle cx="90" cy="40" r="8" fill="#00FF99" />
//     <polyline points="45,65 60,80 85,50" stroke="#00FF99" strokeWidth="8" fill="none" strokeLinecap="round"/>
//   </svg>,
//   // Etapa 5: logo final (imagem real)
//   <div key={4} className="transition-all duration-700 ease-in-out scale-100 opacity-100">
//     {LogoSVG}
//   </div>
// ];

// export default function DashboardLoading() {
//   const [step, setStep] = useState(0);

//   useEffect(() => {
//     let timeout: NodeJS.Timeout;
//     if (step < steps.length - 1) {
//       timeout = setTimeout(() => setStep(step + 1), 700);
//     } else if (step === steps.length - 1) {
//       // Último passo (logo), fica mais tempo
//       timeout = setTimeout(() => {}, 1500);
//     }
//     return () => clearTimeout(timeout);
//   }, [step]);

//   return (
//     <div className="w-screen flex min-h-screen flex-col items-center justify-center bg-background-default-default">
//       <div className="mb-8 flex h-32 w-32 items-center justify-center rounded-xl bg-primary/10 transition-all duration-700">
//         {steps[step]}
//       </div>
//       <h2 className="mb-2 text-2xl font-semibold text-foreground-default transition-all duration-700">
//         {step < steps.length - 1 ? "Montando sua experiência..." : "Fazer novo pedido"}
//       </h2>
//       <p className="text-center text-muted-foreground transition-all duration-700">
//         {step < steps.length - 1
//           ? "Estamos preparando seu dashboard, aguarde um momento..."
//           : "Tudo pronto para começar!"}
//       </p>
//     </div>
//   );
// }