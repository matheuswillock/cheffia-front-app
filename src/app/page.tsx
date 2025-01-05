import { ApresentationSection } from "@/components/ApresentationSection";
import { PlanAndPricesSection } from "@/components/PlanAndPricesSection";
import { Sidebar } from "@/components/SideBar";
import PulsatingButton from "@/components/ui/pulsating-button";
import { TextAnimate } from "@/components/ui/text-animate";
import Link from "next/link";

export default function Home() {
  return (
    <div className="container mx-auto p-4 text-foreground">
      <Sidebar />
      <main className="mt-32">
        <section className=" flex flex-col justify-items-center items-center hero text-center py-20 gap-4">
          <div className="flex items-center flex-col gap-6 mb-8">
            
            <h2 className="text-6xl font-bold text-defaultForeground">
              <TextAnimate animation="slideUp" by="word">
                Simplifique os pedidos com Cheffia
              </TextAnimate>
            </h2>

            <h3 className="tracking-normal text-3xl text-defaultDarkForeground">
              <TextAnimate animation="slideUp" by="word">
                O Cheffia é a solução completa para gerenciar pedidos, melhorar
                a experiência do cliente e aumentar suas vendas
              </TextAnimate>
            </h3>
          </div>

          <PulsatingButton
            className=" text-defaultButtonColor bg-defaultButtonBackgroung max-w-96 h-24 px-20 text-4xl font-semibold "
            pulseColor="#a1a1aa"
          >
            <Link href="register/restaurant">Começar</Link>
          </PulsatingButton>
        </section>
        <ApresentationSection />
        <PlanAndPricesSection />
      </main>
      <footer className="py-6 text-center text-colorSecondary w-full ">
        <p>&copy; 2023 Cheffia. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}
