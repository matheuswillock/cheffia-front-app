"use client"

import { useState } from "react"

import AskAQuestion from "@/components/AskAQuestion"
import JoinWaitlist from "@/components/JoinWaitlist"
import { LandingExperience } from "@/components/landing/LandingExperience"

export default function Home() {
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false)
  const [isWaitlistModalOpen, setIsWaitlistModalOpen] = useState(false)

  return (
    <>
      <AskAQuestion
        isOpen={isQuestionModalOpen}
        onClose={() => setIsQuestionModalOpen(false)}
      />
      <JoinWaitlist
        isOpen={isWaitlistModalOpen}
        onClose={() => setIsWaitlistModalOpen(false)}
      />
      <LandingExperience
        onJoinWaitlist={() => setIsWaitlistModalOpen(true)}
        onAskQuestion={() => setIsQuestionModalOpen(true)}
      />
    </>
  )
}
