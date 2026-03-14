"use client";

import React, { useEffect, useRef, useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import closeIcon from "../public/assets/Icons/close.svg";
import Image from "next/image";
import { UseJoinWaitlistForm } from "@/hooks/UseForms";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "./ui/form";
import { joinCheffiaWaitlist } from "@/api/discordClient";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Label } from "@radix-ui/react-label";

interface JoinWaitlistProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function JoinWaitlistModal({ isOpen, onClose }: JoinWaitlistProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [selectedValue, setSelectedValue] = useState<string>("");
  const [selectedRestaurantSize, setSelectedRestaurantSize] = useState<string>("");

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

  const form = UseJoinWaitlistForm();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    form.handleSubmit(async (data) => {
      await joinCheffiaWaitlist(data);
      form.reset();
      onClose();
    })();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-65 flex items-start justify-center z-50 overflow-y-auto py-10"
      onClick={handleClickOutside}
    >
      <div
        ref={modalRef}
        className="
          relative
          bg-background-cardAdvantages
          py-16
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
        <Button
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
        </Button>

        <div className="flex flex-col items-center justify-center gap-2 md:gap-[9px]">
          <div className="text-4xl md:text-5xl font-medium xl:text-6xl flex flex-col items-center justify-center">
            <p>Entrar na</p>
            <p>
              <span className="font-extralight">lista de</span> espera
            </p>
          </div>
          <p className="font-inter font-light sm:font-normal text-sm md:text-base xl:text-xl text-center leading-4 text-foreground-footer">
            TRANSFORME A EXPERIÊNCIA DO SEU CLIENTE!
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={handleSubmit} className="w-full">
            <div className="flex flex-col gap-6 ">
              <div className="grid gap-2 lg:gap-3 xl:gap-4 mb-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel
                        className={`text-sm md:text-base lg:text-lg xl:text-xl font-medium ml-2 ${
                          form.formState.errors.name?.message && "text-red-500"
                        }`}
                      >
                        Seu Nome
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          id="name"
                          type="text"
                          className={`w-full font-medium transition-all duration-800 rounded-xl ${
                            form.formState.errors.name?.message &&
                            "border-red-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-500"
                          }`}
                          placeholder="John Doe"
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
                  name="restaurantName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel
                        className={`text-sm md:text-base lg:text-lg xl:text-xl font-medium ml-2 ${
                          form.formState.errors.restaurantName?.message &&
                          "text-red-500"
                        }`}
                      >
                        Nome do seu restaurante
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          id="restaurantName"
                          type="text"
                          className={`w-full font-medium transition-all duration-800 rounded-xl ${
                            form.formState.errors.restaurantName?.message &&
                            "border-red-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-500"
                          }`}
                          placeholder="Nome do restaurante"
                          name="restaurantName"
                          required
                          onBlur={async () => {
                            await form.trigger("restaurantName");
                          }}
                        />
                      </FormControl>
                      <FormMessage className=" text-red-500">
                        {form.formState.errors.restaurantName?.message}
                      </FormMessage>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel
                        className={`text-sm md:text-base lg:text-lg xl:text-xl font-medium ml-2 ${
                          form.formState.errors.restaurantName?.message &&
                          "text-red-500"
                        }`}
                      >
                        Email do restaurante
                      </FormLabel>
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
                        <FormLabel
                          className={`text-sm md:text-base lg:text-lg xl:text-xl font-medium ml-2 ${
                            form.formState.errors.countryCode?.message &&
                            "text-red-500"
                          }`}
                        >
                          País
                        </FormLabel>
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
                    name="restaurantContact"
                    render={({ field }) => (
                      <FormItem className="flex-grow">
                        <FormLabel
                          className={`text-sm md:text-base lg:text-lg xl:text-xl font-medium ml-2 ${
                            form.formState.errors.restaurantContact?.message &&
                            "text-red-500"
                          }`}
                        >
                          Telefone para contato
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            id="restaurantContact"
                            type="tel"
                            placeholder="(11) 99999-9999"
                            name="restaurantContact"
                            pattern="^\(\d{2}\) \d{5}-\d{4}$"
                            required
                            className={`w-full font-medium transition-all duration-800 rounded-xl ${
                              form.formState.errors.restaurantContact
                                ?.message &&
                              "border-red-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-500"
                            }`}
                            onBlur={async () => {
                              await form.trigger("restaurantContact");
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
                          {form.formState.errors.restaurantContact?.message}
                        </FormMessage>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex flex-row gap-2 w-full">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem className="flex-grow">
                        <FormLabel
                          className={`text-sm md:text-base lg:text-lg xl:text-xl font-medium ml-2 ${
                            form.formState.errors.restaurantContact?.message &&
                            "text-red-500"
                          }`}
                        >
                          Cidade
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            id="city"
                            type="text"
                            className={`w-full font-medium transition-all duration-800 rounded-xl ${
                              form.formState.errors.city?.message &&
                              "border-red-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-500"
                            }`}
                            placeholder="Cidade"
                            name="city"
                            required
                            onBlur={async () => {
                              await form.trigger("city");
                            }}
                          />
                        </FormControl>
                        <FormMessage className=" text-red-500">
                          {form.formState.errors.city?.message}
                        </FormMessage>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel
                          className={`text-sm md:text-base lg:text-lg xl:text-xl font-medium ml-2 ${
                            form.formState.errors.restaurantContact?.message &&
                            "text-red-500"
                          }`}
                        >
                          Estado
                        </FormLabel>
                        <FormControl>
                          <Select
                            {...field}
                            name="state"
                            required
                            value={selectedValue}
                            onValueChange={setSelectedValue}
                          >
                            <SelectTrigger className="w-44">
                              <SelectValue placeholder="Selecione um estado" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="AC">AC</SelectItem>
                              <SelectItem value="AL">AL</SelectItem>
                              <SelectItem value="AP">AP</SelectItem>
                              <SelectItem value="AM">AM</SelectItem>
                              <SelectItem value="BA">A</SelectItem>
                              <SelectItem value="CE">CE</SelectItem>
                              <SelectItem value="DF">DF</SelectItem>
                              <SelectItem value="ES">ES</SelectItem>
                              <SelectItem value="GO">GO</SelectItem>
                              <SelectItem value="MA">MA</SelectItem>
                              <SelectItem value="MT">MT</SelectItem>
                              <SelectItem value="MS">MS</SelectItem>
                              <SelectItem value="MG">MG</SelectItem>
                              <SelectItem value="PA">PA</SelectItem>
                              <SelectItem value="PB">PB</SelectItem>
                              <SelectItem value="PR">PR</SelectItem>
                              <SelectItem value="PE">PE</SelectItem>
                              <SelectItem value="PI">PI</SelectItem>
                              <SelectItem value="RJ">RJ</SelectItem>
                              <SelectItem value="RN">RN</SelectItem>
                              <SelectItem value="RS">RS</SelectItem>
                              <SelectItem value="RO">RO</SelectItem>
                              <SelectItem value="RR">RR</SelectItem>
                              <SelectItem value="SC">SC</SelectItem>
                              <SelectItem value="SP">SP</SelectItem>
                              <SelectItem value="SE">SE</SelectItem>
                              <SelectItem value="TO">TO</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage className=" text-red-500">
                          {form.formState.errors.state?.message}
                        </FormMessage>
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="restaurantSize"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel
                        className={`text-sm md:text-base lg:text-lg xl:text-xl font-medium ml-2 ${
                          form.formState.errors.restaurantSize?.message &&
                          "text-red-500"
                        }`}
                      >
                        Porte do restaurante
                      </FormLabel>
                      <FormControl>
                        <RadioGroup
                          {...field}
                          name="restaurantSize"
                          defaultValue={selectedRestaurantSize}
                          onValueChange={(value) => {
                            field.onChange(value);
                            setSelectedRestaurantSize(value);
                          }}
                          className="
                            font-normal
                            font-inter
                            text-foreground-card
                            text-sm
                            md:text-base
                            lg:text-lg
                            pl-4
                          "
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem
                              value="Microempreendedor Individual (MEI)"
                              id="Microempreendedor Individual (MEI)"
                            />
                            <Label htmlFor="Microempreendedor Individual (MEI)">
                              Microempreendedor Individual (MEI)
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem
                              value="Microempresa (ME)"
                              id="Microempresa (ME)"
                            />
                            <Label htmlFor="Microempresa (ME)">
                              Microempresa (ME)
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem
                              value="Empresa de pequeno porte (EPP)"
                              id="Empresa de pequeno porte (EPP)"
                            />
                            <Label htmlFor="Empresa de pequeno porte (EPP)">
                              Empresa de pequeno porte (EPP)
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem
                              value="Empresa de médio porte"
                              id="Empresa de médio porte"
                            />
                            <Label htmlFor="Empresa de médio porte">
                              Empresa de médio porte
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem
                              value="Empresa de grande porte"
                              id="Empresa de grande porte"
                            />
                            <Label htmlFor="Empresa de grande porte">
                              Empresa de grande porte
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem
                              value="Não se aplica"
                              id="Não se aplica"
                            />
                            <Label htmlFor="Não se aplica">Não se aplica</Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage className=" text-red-500">
                        {form.formState.errors.email?.message}
                      </FormMessage>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ticketAverage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel
                        className={`text-sm md:text-base lg:text-lg xl:text-xl font-medium ml-2 ${
                          form.formState.errors.restaurantSize?.message &&
                          "text-red-500"
                        }`}
                      >
                        Ticket médio do estabelecimento por cliente
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          id="ticketAverage"
                          type="text"
                          className={`w-full font-medium transition-all duration-800 rounded-xl ${
                            form.formState.errors.ticketAverage?.message &&
                            "border-red-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-500"
                          }`}
                          placeholder="R$ 100,00"
                          name="ticketAverage"
                          required
                          onBlur={async () => {
                            await form.trigger("ticketAverage");
                          }}
                          onChange={(e) => {
                            let input = e.target.value.replace(/[^\d.,]/g, ""); // Remove letras e caracteres inválidos
                            input = input.replace(/\./g, ","); // Substitui pontos por vírgulas
                            if (!input.startsWith("R$ ")) {
                              input = `R$ ${input}`;
                            }
                            field.onChange(input);
                          }}
                        />
                      </FormControl>
                      <FormMessage className=" text-red-500">
                        {form.formState.errors.ticketAverage?.message}
                      </FormMessage>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="platformName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel
                        className={`text-sm md:text-base lg:text-lg xl:text-xl font-medium ml-2 ${
                          form.formState.errors.restaurantSize?.message &&
                          "text-red-500"
                        }`}
                      >
                        Já utiliza alguma plataforma de gestão? Se sim, qual?
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          id="platformName"
                          type="text"
                          className={`w-full font-medium transition-all duration-800 rounded-xl ${
                            form.formState.errors.platformName?.message &&
                            "border-red-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-500"
                          }`}
                          placeholder="Nome da plataforma"
                          name="platformName"
                          required
                          onBlur={async () => {
                            await form.trigger("platformName");
                          }}
                        />
                      </FormControl>
                      <FormMessage className=" text-red-500">
                        {form.formState.errors.platformName?.message}
                      </FormMessage>
                    </FormItem>
                  )}
                />
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
                Entrar na lista de espera
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
