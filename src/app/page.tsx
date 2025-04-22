import { Navbar } from "@/components/Navbar";
import Link from "next/link";
import ApresentationMobileMockupSection from "@/components/ApresentationMobileMockupSection";
import ApresentationFeaturesSection from "@/components/ApresentationFeaturesSection";
import ApresentationCheffiaAbout from "@/components/ApresentationCheffiaAbout";
import ApresentationCheffiaCompetitiveAdvantages from "@/components/ApresentationCheffiaCompetitiveAdvantages";
import ApresentationMissionAndValues from "@/components/ApresentationMissionAndValues";
import ApresentationQuestionsAndAsnwers from "@/components/ApresentationQuestionsAndAsnwers";
import FooterSection from "@/components/FooterSection";
import { ApresentationPrincipalFeaturesSection } from "@/components/ApresentationPrincipalFeaturesSection";
import ApresentationInitialSection from "@/components/ApresentationInitialSection";
import ButtonClickToTop from "@/components/ButtonClickToTop";
import NeonEffects from "@/components/NeonEffects";

export default function Home() {
  return (
    <div className="container w-full mx-auto overflow-hidden">
      <Navbar />
      <ButtonClickToTop />
      <NeonEffects />
      <main>
        <aside className="bg-transparent container">
          <ApresentationInitialSection />
          <ApresentationPrincipalFeaturesSection />
          <ApresentationMobileMockupSection />
          <ApresentationFeaturesSection />
          <ApresentationCheffiaAbout />
          <ApresentationCheffiaCompetitiveAdvantages />
          <ApresentationMissionAndValues />
          <ApresentationQuestionsAndAsnwers />
        </aside>
      </main>
      <footer className="container text-center w-full flex flex-col py-10 gap-4 bg-background-default">
        <FooterSection />

        <div className="w-full border-t-2 border-t-background-cardAdvantages pt-6 flex flex-col items-center justify-center gap-4">
          <div className="flex flex-row-reverse items-center justify-center gap-6">
            <Link
              href={""}
              className="text-xs font-inter text-foreground-footer leading-3"
            >
              Termos de uso
            </Link>
            <Link
              href={""}
              className="text-xs font-inter text-foreground-footer leading-3"
            >
              Política de cookies
            </Link>
          </div>
          <p className="text-xs font-inter text-foreground-footer leading-3 ">
            2025&copy; Cheffia - Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
