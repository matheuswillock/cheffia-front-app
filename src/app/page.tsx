"use client";

import { useState } from "react";
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
import AskAQuestion from "@/components/AskAQuestion";
import JoinWaitlist from "@/components/JoinWaitlist";

export default function Home() {
  const [isSendAskModalOpen, setIsSendAskModalOpen] = useState(false);
  const [isWailtistModalOpen, setIsWailtistModalOpen] = useState(false);

  return (
    <div className="w-screen mx-auto overflow-hidden">
      <Navbar />
      <ButtonClickToTop />
      <NeonEffects />
      <AskAQuestion
        isOpen={isSendAskModalOpen}
        onClose={() => setIsSendAskModalOpen(false)}
      />
      <JoinWaitlist
        isOpen={isWailtistModalOpen}
        onClose={() => setIsWailtistModalOpen(false)}
      />

      <main className="w-screen">
        <aside className="bg-transparent w-screen">
          <ApresentationInitialSection
            setIsModalOpen={() => setIsWailtistModalOpen(true)}
          />
          <ApresentationPrincipalFeaturesSection />
          <ApresentationMobileMockupSection />
          <ApresentationFeaturesSection
            setIsModalOpen={() => setIsWailtistModalOpen(true)}
          />
          <ApresentationCheffiaAbout
            setIsModalOpen={() => setIsWailtistModalOpen(true)}
          />
          <ApresentationCheffiaCompetitiveAdvantages
            setIsModalOpen={() => setIsWailtistModalOpen(true)}
          />
          <ApresentationMissionAndValues
            setIsModalOpen={() => setIsWailtistModalOpen(true)}
          />
          <ApresentationQuestionsAndAsnwers
            setIsModalOpen={() => setIsSendAskModalOpen(true)}
          />
        </aside>
      </main>

      <footer className="w-screen text-center flex flex-col py-10 gap-4 md:gap-0 bg-background-default">
        <FooterSection />
        <div
          className="
            w-full
            border-t-2
            border-t-background-cardAdvantages
            pt-6
            px-8
            md:px-16
            flex
            flex-col
            md:flex-row
            items-center
            justify-center
            md:justify-between
            gap-4
          "
        >
          <div className="flex flex-row-reverse items-center justify-center gap-6 text-xs lg:text-base font-inter text-foreground-footer leading-3">
            <Link href={""}>Termos de uso</Link>
            <Link href={""}>Política de cookies</Link>
          </div>
          <p className="text-xs lg:text-base font-inter text-foreground-footer leading-3">
            2025&copy; Cheffia - Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}