"use client";

import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { X } from "@/components/animate-ui/icons/x";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "./ui/form";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Spinner } from "./ui/spinner";
import { UseJoinWaitlistForm } from "@/hooks/UseForms";
import { joinCheffiaWaitlist } from "@/lib/api/discordClient";
import { fetchAddressByPostalCode, formatPostalCode } from "@/lib/api/postalCodeClient";
import type { JoinWaitlistData } from "@/types/formTypes";

interface JoinWaitlistProps {
  isOpen: boolean;
  onClose: () => void;
}

const restaurantSizes = [
  "Microempreendedor Individual (MEI)",
  "Microempresa (ME)",
  "Empresa de pequeno porte (EPP)",
  "Empresa de médio porte",
  "Empresa de grande porte",
  "Não se aplica",
] as const;

const brazilStateValues = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
] as const;

type BrazilState = (typeof brazilStateValues)[number];
const brazilStateSet = new Set<string>(brazilStateValues);

export default function JoinWaitlistModal({ isOpen, onClose }: JoinWaitlistProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCepLoading, setIsCepLoading] = useState(false);
  const [lastLookupCep, setLastLookupCep] = useState("");
  const [cepLookupError, setCepLookupError] = useState<string | null>(null);
  const form = UseJoinWaitlistForm();

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

  useEffect(() => {
    if (!isOpen) {
      setIsCepLoading(false);
      setCepLookupError(null);
      setLastLookupCep("");
    }
  }, [isOpen]);

  const handleClickOutside = (event: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
      onClose();
    }
  };

  const handlePostalCodeBlur = async () => {
    const currentPostalCode = form.getValues("postalCode");
    const formattedPostalCode = formatPostalCode(currentPostalCode);
    const sanitizedPostalCode = formattedPostalCode.replace(/\D/g, "");

    form.setValue("postalCode", formattedPostalCode, {
      shouldDirty: true,
      shouldValidate: true,
    });

    setCepLookupError(null);
    await form.trigger("postalCode");

    if (sanitizedPostalCode.length !== 8) {
      return;
    }

    if (lastLookupCep === sanitizedPostalCode) {
      return;
    }

    setIsCepLoading(true);

    try {
      const addressData = await fetchAddressByPostalCode(sanitizedPostalCode);

      if (!addressData) {
        setCepLookupError("Não foi possível localizar esse CEP.");
        toast.error("Não foi possível localizar esse CEP.", {
          description: "Confira o CEP e preencha os campos de endereço manualmente.",
        });
        return;
      }

      form.setValue("postalCode", addressData.postalCode, {
        shouldDirty: true,
        shouldValidate: true,
      });
      form.setValue("street", addressData.street, {
        shouldDirty: true,
        shouldValidate: true,
      });
      form.setValue("city", addressData.city, {
        shouldDirty: true,
        shouldValidate: true,
      });
      const normalizedState = addressData.state.toUpperCase();
      if (brazilStateSet.has(normalizedState)) {
        form.setValue("state", normalizedState as BrazilState, {
          shouldDirty: true,
          shouldValidate: true,
        });
      }
      form.setValue("country", addressData.country, {
        shouldDirty: true,
        shouldValidate: true,
      });
      setLastLookupCep(sanitizedPostalCode);
    } catch (error) {
      console.error("Postal code lookup failed:", error);
      setCepLookupError("Erro ao buscar endereço pelo CEP.");
      toast.error("Erro ao buscar CEP.", {
        description: "Tente novamente ou preencha os campos manualmente.",
      });
    } finally {
      setIsCepLoading(false);
    }
  };

  const handleSubmit = form.handleSubmit(async (data: JoinWaitlistData) => {
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      const output = await joinCheffiaWaitlist(data);

      if (!output?.isValid) {
        toast.error("Não foi possível enviar seus dados.", {
          description: output?.errorMessages?.[0] ?? "Tente novamente em instantes.",
        });
        return;
      }

      toast.success("Inscrição realizada com sucesso!", {
        description: "Seus dados foram enviados para a lista de espera da Cheffia.",
      });
      form.reset();
      setCepLookupError(null);
      setLastLookupCep("");
      onClose();
    } catch (error) {
      console.error("Failed to submit waitlist form:", error);
      toast.error("Falha ao enviar formulário.", {
        description: "Não foi possível salvar sua inscrição. Tente novamente.",
      });
    } finally {
      setIsSubmitting(false);
    }
  });

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/65 py-10"
      onClick={handleClickOutside}
    >
      <div
        ref={modalRef}
        className="
          relative
          flex
          h-auto
          w-11/12
          max-w-md
          flex-col
          items-center
          justify-center
          gap-8
          rounded-lg
          bg-background-cardAdvantages
          px-6
          py-16
          shadow-lg
          md:max-w-lg
          md:px-8
          lg:max-w-xl
          lg:px-10
          xl:max-w-2xl
          xl:px-16
          2xl:max-w-3xl
        "
      >
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="
            absolute
            right-5
            top-5
            rounded-md
            bg-button
            text-foreground-aboutBlack
            shadow-none
            transition-transform
            duration-200
            hover:scale-105
            hover:bg-button
            hover:text-foreground-aboutBlack
            focus-visible:ring-0
            focus-visible:ring-offset-0
            [&_svg]:pointer-events-auto
          "
        >
          <X aria-hidden="true" size={16} animateOnHover animateOnTap />
          <span className="sr-only">Fechar</span>
        </Button>

        <div className="flex flex-col items-center justify-center gap-2 md:gap-[9px]">
          <div className="flex flex-col items-center justify-center text-4xl font-medium md:text-5xl xl:text-6xl">
            <p>Entrar na</p>
            <p>
              <span className="font-extralight">lista de</span> espera
            </p>
          </div>
          <p className="text-center font-inter text-sm font-light leading-4 text-foreground-footer sm:font-normal md:text-base xl:text-xl">
            TRANSFORME A EXPERIÊNCIA DO SEU CLIENTE!
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={handleSubmit} className="w-full">
            <div className="flex flex-col gap-6">
              <div className="mb-2 grid gap-2 lg:gap-3 xl:gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="ml-2 text-sm font-medium md:text-base lg:text-lg xl:text-xl">
                        Seu Nome
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          id="name"
                          type="text"
                          className="w-full rounded-xl font-medium"
                          placeholder="John Doe"
                          required
                          onBlur={async () => {
                            await form.trigger("name");
                          }}
                        />
                      </FormControl>
                      <FormMessage className="text-red-500" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="restaurantName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="ml-2 text-sm font-medium md:text-base lg:text-lg xl:text-xl">
                        Nome do seu restaurante
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          id="restaurantName"
                          type="text"
                          className="w-full rounded-xl font-medium"
                          placeholder="Nome do restaurante"
                          required
                          onBlur={async () => {
                            await form.trigger("restaurantName");
                          }}
                        />
                      </FormControl>
                      <FormMessage className="text-red-500" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="ml-2 text-sm font-medium md:text-base lg:text-lg xl:text-xl">
                        Email do restaurante
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          id="email"
                          type="email"
                          placeholder="E-mail"
                          required
                          className="w-full rounded-xl font-medium"
                          onBlur={async () => {
                            await form.trigger("email");
                          }}
                        />
                      </FormControl>
                      <FormMessage className="text-red-500" />
                    </FormItem>
                  )}
                />

                <div className="flex w-full flex-row gap-2">
                  <FormField
                    control={form.control}
                    name="countryCode"
                    render={({ field }) => (
                      <FormItem className="w-[84px]">
                        <FormLabel className="ml-2 text-sm font-medium md:text-base lg:text-lg xl:text-xl">
                          País
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            id="countryCode"
                            type="tel"
                            placeholder="+55"
                            required
                            className="w-full rounded-xl font-medium"
                            onBlur={async () => {
                              await form.trigger("countryCode");
                            }}
                            onChange={(event) => {
                              const sanitized = event.target.value.replace(/\D/g, "");
                              field.onChange(`+${sanitized}`);
                            }}
                          />
                        </FormControl>
                        <FormMessage className="text-red-500" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="restaurantContact"
                    render={({ field }) => (
                      <FormItem className="flex-grow">
                        <FormLabel className="ml-2 text-sm font-medium md:text-base lg:text-lg xl:text-xl">
                          Telefone para contato
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            id="restaurantContact"
                            type="tel"
                            placeholder="(11) 99999-9999"
                            required
                            className="w-full rounded-xl font-medium"
                            onBlur={async () => {
                              await form.trigger("restaurantContact");
                            }}
                            onChange={(event) => {
                              const input = event.target.value.replace(/\D/g, "").slice(0, 11);
                              const formatted = input
                                .replace(/^(\d{2})(\d)/, "($1) $2")
                                .replace(/(\d{5})(\d)/, "$1-$2");
                              field.onChange(formatted);
                            }}
                          />
                        </FormControl>
                        <FormMessage className="text-red-500" />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-2 md:grid-cols-[1fr,2fr]">
                  <FormField
                    control={form.control}
                    name="postalCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="ml-2 text-sm font-medium md:text-base lg:text-lg xl:text-xl">
                          CEP
                        </FormLabel>
                        <div className="relative">
                          <FormControl>
                            <Input
                              {...field}
                              id="postalCode"
                              type="text"
                              placeholder="01310-100"
                              required
                              className="w-full rounded-xl pr-10 font-medium"
                              onBlur={handlePostalCodeBlur}
                              onChange={(event) => {
                                const formatted = formatPostalCode(event.target.value);
                                field.onChange(formatted);

                                const digits = formatted.replace(/\D/g, "");
                                if (digits !== lastLookupCep) {
                                  setCepLookupError(null);
                                }
                              }}
                            />
                          </FormControl>
                          {isCepLoading && (
                            <Spinner className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-foreground-footer" />
                          )}
                        </div>
                        <FormMessage className="text-red-500">
                          {form.formState.errors.postalCode?.message ?? cepLookupError}
                        </FormMessage>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="street"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="ml-2 text-sm font-medium md:text-base lg:text-lg xl:text-xl">
                          Rua
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            id="street"
                            type="text"
                            placeholder="Av. Paulista"
                            required
                            className="w-full rounded-xl font-medium"
                            onBlur={async () => {
                              await form.trigger("street");
                            }}
                          />
                        </FormControl>
                        <FormMessage className="text-red-500" />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-[2fr,1fr] gap-2">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="ml-2 text-sm font-medium md:text-base lg:text-lg xl:text-xl">
                          Cidade
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            id="city"
                            type="text"
                            placeholder="São Paulo"
                            required
                            className="w-full rounded-xl font-medium"
                            onBlur={async () => {
                              await form.trigger("city");
                            }}
                          />
                        </FormControl>
                        <FormMessage className="text-red-500" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="ml-2 text-sm font-medium md:text-base lg:text-lg xl:text-xl">
                          Estado (UF)
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            id="state"
                            type="text"
                            placeholder="SP"
                            required
                            maxLength={2}
                            className="w-full rounded-xl font-medium uppercase"
                            onBlur={async () => {
                              await form.trigger("state");
                            }}
                            onChange={(event) => {
                              field.onChange(event.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 2));
                            }}
                          />
                        </FormControl>
                        <FormMessage className="text-red-500" />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-2 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="ml-2 text-sm font-medium md:text-base lg:text-lg xl:text-xl">
                          País
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            id="country"
                            type="text"
                            placeholder="Brasil"
                            required
                            className="w-full rounded-xl font-medium"
                            onBlur={async () => {
                              await form.trigger("country");
                            }}
                          />
                        </FormControl>
                        <FormMessage className="text-red-500" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="addressNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="ml-2 text-sm font-medium md:text-base lg:text-lg xl:text-xl">
                          Número
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            id="addressNumber"
                            type="text"
                            placeholder="1000"
                            required
                            className="w-full rounded-xl font-medium"
                            onBlur={async () => {
                              await form.trigger("addressNumber");
                            }}
                          />
                        </FormControl>
                        <FormMessage className="text-red-500" />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="restaurantSize"
                  render={({ field }) => (
                    <FormItem className="flex flex-col my-3">
                      <FormLabel className="ml-2 text-sm font-medium md:text-base lg:text-lg xl:text-xl">
                        Porte do restaurante
                      </FormLabel>
                      <FormControl>
                        <RadioGroup
                          value={field.value}
                          onValueChange={field.onChange}
                          className="pl-4 font-inter text-sm font-normal text-foreground-card md:text-base lg:text-lg flex flex-col gap-3"
                        >
                          {restaurantSizes.map((sizeValue) => {
                            const inputId = `restaurant-size-${sizeValue
                              .toLowerCase()
                              .replace(/[^a-z0-9]+/g, "-")
                              .replace(/(^-|-$)/g, "")}`;

                            return (
                              <div key={sizeValue} className="flex items-center gap-2">
                                <RadioGroupItem value={sizeValue} id={inputId} />
                                <Label htmlFor={inputId}>{sizeValue}</Label>
                              </div>
                            );
                          })}
                        </RadioGroup>
                      </FormControl>
                      <FormMessage className="text-red-500" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ticketAverage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="ml-2 text-sm font-medium md:text-base lg:text-lg xl:text-xl">
                        Ticket médio do estabelecimento por cliente
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          id="ticketAverage"
                          type="text"
                          className="w-full rounded-xl font-medium"
                          placeholder="R$ 100,00"
                          onBlur={async () => {
                            await form.trigger("ticketAverage");
                          }}
                          onChange={(event) => {
                            let input = event.target.value.replace(/[^\d.,]/g, "");
                            input = input.replace(/\./g, ",");
                            if (input && !input.startsWith("R$ ")) {
                              input = `R$ ${input}`;
                            }
                            field.onChange(input);
                          }}
                        />
                      </FormControl>
                      <FormMessage className="text-red-500" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="platformName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="ml-2 text-sm font-medium md:text-base lg:text-lg xl:text-xl">
                        Já utiliza alguma plataforma de gestão? Se sim, qual?
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          id="platformName"
                          type="text"
                          className="w-full rounded-xl font-medium"
                          placeholder="Nome da plataforma"
                          onBlur={async () => {
                            await form.trigger("platformName");
                          }}
                        />
                      </FormControl>
                      <FormMessage className="text-red-500" />
                    </FormItem>
                  )}
                />
              </div>

              <Button
                type="submit"
                disabled={!form.formState.isValid || isSubmitting}
                className="
                  h-9
                  w-full
                  rounded-xl
                  bg-button
                  px-6
                  text-center
                  font-inter
                  text-lg
                  font-semibold
                  text-foreground-aboutBlack
                  shadow-md
                  transition
                  duration-300
                  ease-in-out
                  hover:bg-button-dark
                  hover:text-foreground-pureWhite
                  hover:shadow-2xl
                  active:bg-button-dark
                  md:h-10
                  md:text-xl
                  xl:h-11
                  xl:px-8
                  xl:text-2xl
                  2xl:h-12
                  2xl:px-10
                "
              >
                {isSubmitting ? (
                  <>
                    <Spinner data-icon="inline-start" />
                    Enviando...
                  </>
                ) : (
                  "Entrar na lista de espera"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
