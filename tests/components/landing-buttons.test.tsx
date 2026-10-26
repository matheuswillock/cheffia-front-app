import { cleanup, fireEvent, render, screen, within } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import ButtonCta from "@/components/ButtonCta"
import ApresentationQuestionsAndAsnwers from "@/components/ApresentationQuestionsAndAsnwers"

describe("landing page buttons", () => {
  afterEach(cleanup)

  it("uses the same primary button treatment for waitlist and question actions", () => {
    render(
      <>
        <ButtonCta setIsModalOpen={vi.fn()} />
        <ApresentationQuestionsAndAsnwers setIsModalOpen={vi.fn()} />
      </>,
    )

    const waitlistButton = screen.getByRole("button", {
      name: "Entrar na lista de espera",
    })
    const questionButton = screen.getByRole("button", {
      name: "Faça uma pergunta",
    })

    expect(waitlistButton).toHaveClass("bg-primary", "rounded-full", "h-9", "xl:h-[52px]")
    expect(questionButton).toHaveClass("bg-primary", "rounded-full", "h-9", "xl:h-[52px]")
  })

  it("opens the question flow from the question action", () => {
    const openQuestion = vi.fn()
    render(<ApresentationQuestionsAndAsnwers setIsModalOpen={openQuestion} />)
    const faqSection = screen
      .getByText("Não encontrou a resposta para a sua dúvida aqui?")
      .closest("section")!

    fireEvent.click(
      within(faqSection).getByRole("button", { name: "Faça uma pergunta" }),
    )

    expect(openQuestion).toHaveBeenCalledTimes(1)
  })
})
