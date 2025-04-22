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

export default function Home() {
  return (
    <div className="container w-full mx-auto overflow-hidden">
      <Navbar />
      <ButtonClickToTop />
      <div className="h-60 w-72 absolute left-0 right-0 mx-auto -z-10">
        <div
          className="
            h-[50%]
            w-full
            rounded-full
            bg-neon-radial
            opacity-45
            blur-3xl
          "
        />
      </div>
      <div className="absolute h-[170px] w-full z-10">
        <div className="flex items-center justify-between w-full h-full px-4">
          <div className="h-[170px] w-[30%] opacity-50 blur-xl bg-background-default rounded-full z-10" />
          <div className="h-[170px] w-[30%] opacity-50 blur-xl bg-background-default rounded-full z-10" />
        </div>
      </div>
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
