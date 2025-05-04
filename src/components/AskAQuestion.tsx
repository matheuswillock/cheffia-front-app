"use client";

import React, { useEffect, useRef, useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import closeIcon from "../../public/assets/Icons/close.svg"
import Image from 'next/image';
import { UseAskAQuestionForm } from "@/hooks/UseForms";
import { Form, FormControl, FormField, FormItem, FormMessage } from "./ui/form";
import { handleSendAsk } from "@/business/discord/discordBusiness";

interface AskAQuestionProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AskAQuestion({ isOpen, onClose }: AskAQuestionProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleClickOutside = (event: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
      onClose();
    }
  };

  const form = UseAskAQuestionForm();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    form.handleSubmit((data) => {
      handleSendAsk(data);
      form.reset();
      onClose();
    })();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-65 flex items-center justify-center z-50"
      onClick={handleClickOutside}
    >
      <div
        ref={modalRef}
        className="
          relative
          bg-background-cardAdvantages
          py-10
          px-6
          md:px-8
          lg:px-10
          xl:px-16
          2xl:px-18
          rounded-lg
          shadow-lg
          w-11/12
          max-w-md
          md:max-w-lg
          lg:max-w-xl
          xl:max-w-2xl
          2xl:max-w-3xl
          h-auto
          flex
          items-center
          justify-center
          flex-col
          gap-8
        "
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 transition-transform duration-300 hover:scale-110"
        >
          <Image
            src={closeIcon}
            alt="Fechar"
            width={24}
            height={24}
            className="w-4 h-4 filter grayscale hover:filter-none"
          />
        </button>

        <div className="flex flex-col items-center justify-center gap-2 md:gap-[9px]">
          <div className="text-4xl md:text-5xl font-medium xl:text-6xl flex flex-col items-center justify-center">
            <p>Retire sua</p>
            <p>
              <span className="font-extralight">dúvida</span> aqui
            </p>
          </div>
          <p className="font-inter font-light sm:font-normal text-sm md:text-base xl:text-xl text-center leading-4 text-foreground-footer">
            Responderemos em breve.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={handleSubmit} className="w-full">
            <div className="flex flex-col gap-6 ">

              <div className="grid gap-3 mb-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          {...field}
                          id="name"
                          type="text"
                          className={`w-full font-medium transition-all duration-800 rounded-xl ${
                            form.formState.errors.name?.message &&
                            "border-red-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-500"
                          }`}
                          placeholder="Seu nome"
                          required
                          onBlur={async () => {
                            await form.trigger("name");
                          }}
                        />
                      </FormControl>
                      <FormMessage className=" text-red-500">
                        {form.formState.errors.name?.message}
                      </FormMessage>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          {...field}
                          id="email"
                          type="email"
                          name="email"
                          placeholder="E-mail"
                          required
                          className={`w-full font-medium transition-all duration-800 rounded-xl ${
                            form.formState.errors.email?.message &&
                            "border-red-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-500"
                          }`}
                          onBlur={async () => {
                            await form.trigger("email");
                          }}
                        />
                      </FormControl>
                      <FormMessage className=" text-red-500">
                        {form.formState.errors.email?.message}
                      </FormMessage>
                    </FormItem>
                  )}
                />

                <div className="flex flex-row gap-2 w-full">
                  <FormField
                    control={form.control}
                    name="countryCode"
                    render={({ field }) => (
                      <FormItem className="w-[70px]">
                        <FormControl>
                          <Input
                            {...field}
                            id="countryCode"
                            type="tel"
                            placeholder="+55"
                            pattern="^\+\d{1,3}$"
                            required
                            className={`w-full font-medium transition-all duration-800 rounded-xl ${
                              form.formState.errors.countryCode?.message &&
                              "border-red-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-500"
                            }`}
                            onBlur={async () => {
                              await form.trigger("countryCode");
                            }}
                            onChange={(e) => {
                              const input = e.target.value.replace(/\D/g, "");
                              field.onChange(`+${input}`);
                            }}
                          />
                        </FormControl>
                        <FormMessage className="text-red-500">
                          {form.formState.errors.countryCode?.message}
                        </FormMessage>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="contact"
                    render={({ field }) => (
                      <FormItem className="flex-grow">
                        <FormControl>
                          <Input
                            {...field}
                            id="contact"
                            type="tel"
                            placeholder="Contato"
                            pattern="^\(\d{2}\) \d{5}-\d{4}$"
                            required
                            className={`w-full font-medium transition-all duration-800 rounded-xl ${
                              form.formState.errors.contact?.message &&
                              "border-red-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-500"
                            }`}
                            onBlur={async () => {
                              await form.trigger("contact");
                            }}
                            onChange={(e) => {
                              const input = e.target.value.replace(/\D/g, "");
                              const formatted = input
                                .replace(/^(\d{2})(\d)/, "($1) $2")
                                .replace(/(\d{5})(\d)/, "$1-$2");
                              field.onChange(formatted);
                            }}
                          />
                        </FormControl>
                        <FormMessage className="text-red-500">
                          {form.formState.errors.contact?.message}
                        </FormMessage>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-2 w-full">
                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea
                            {...field}
                            id="message"
                            name="message"
                            placeholder="Escreva sua dúvida"
                            rows={6}
                            maxLength={500}
                            required
                            className={`w-full font-medium transition-all duration-800 rounded-xl ${
                              form.formState.errors.message?.message &&
                              "border-red-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-500"
                            }`}
                            onChange={async (e) => {
                              field.onChange(e);
                              await form.trigger("message");
                            }}
                          />
                        </FormControl>
                        <FormMessage className="text-red-500">
                          {form.formState.errors.message?.message}
                        </FormMessage>
                        <div className="flex justify-end items-center text-sm">
                          <span
                            className={`${
                              field.value.length > 500
                                ? "text-red-500"
                                : "text-foreground-footer"
                            }`}
                          >
                            {field.value.length}/500
                          </span>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={!form.formState.isValid}
                className="
                  w-full
                  rounded-xl
                  text-lg
                  md:text-xl
                  xl:text-2xl
                  h-9
                  md:h-10
                  xl:h-11
                  2xl:h-12
                  px-6
                  xl:px-8
                  2xl:px-10
                  text-center
                  font-inter
                  font-semibold
                  bg-button
                  text-foreground-aboutBlack
                  hover:bg-button-solid
                  hover:text-background
                  mouse-pointer
                  hover:shadow-2xl
                  shadow-md
                  hover:bg-button-dark
                  hover:text-foreground-pureWhite
                  active:bg-button-dark
                  transition
                  duration-300
                  ease-in-out
                "
              >
                Enviar Pergunta
              </Button>

            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}