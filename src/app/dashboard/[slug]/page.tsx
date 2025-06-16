"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Separator } from "@/components/ui/separator"
import DollarSignIcon from "../../../../public/assets/Icons/dollar-sign.svg"
import OpenedEye from "../../../../public/assets/Icons/eye.svg";
import ClosedEye from "../../../../public/assets/Icons/eye-closed.svg";
import AvaliationStar from "../../../../public/assets/Icons/avaliation-star.svg"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { handleGetRestaurantById } from "@/business/restaurant/restaurantBusiness"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import Image from "next/image"
import { Status } from "@/models/Status"
import Link from "next/link"
import { OutputGetRestaurantById } from "@/models/dtos/output/Restaurant/OutputGetRestaurantById"
import DashboardLoading from "./container/DashboardLoading"
import AppSidebar from "./container/AppSidebar"
import { TableOccupancyComponent } from "./container/TableOccupancyComponent"
import StatusComponent from "./container/StatusComponent"

export default function DashboardPage() {
  const { slug } = useParams()
  const [isShowValues, setIsShowValues] = useState(false)
  const [today, setToday] = useState(() => new Date().toLocaleString("pt-BR", {
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).replace(", ", " - "));

  useEffect(() => {
    const interval = setInterval(() => {
      setToday(new Date().toLocaleString("pt-BR", {
        year: "2-digit",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }).replace(", ", " - "));
    }, 60000); // Update every minute

    return () => clearInterval(interval); // Cleanup on component unmount
  }, []);

  const [userMetadata, setUserMetadata] = useState<OutputGetRestaurantById | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      const data = await handleGetRestaurantById(slug as string)
      setUserMetadata(data)
    }

    fetchData().then(() => {})
  }, [slug])

  if (!userMetadata) {
    return <DashboardLoading />
  }

  return (
    <SidebarProvider>
      <AppSidebar
        Name={userMetadata.name}
        Email={userMetadata.email}
        Avatar={userMetadata.providerAvatarUrl}
        RestaurantId={userMetadata.id}
      />

      <SidebarInset className="w-screen flex-1 flex flex-col gap-12 overflow-y-auto p-4 md:p-4 lg:px-6 lg:py-8 ">
        <header
          className="
            flex
            h-16
            shrink-0
            items-center
            justify-between
            gap-2
            transition-[width,height]
            ease-linear
            group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12
            group-has-[[data-collapsible=icon]]/sidebar-wrapper:overflow-hidden
          "
        >
          <div className="flex items-center justify-between gap-2">
            <SidebarTrigger className="-ml-1 my-0" />
            <Separator orientation="vertical" className="mr-2 h-6" />
            <h2 className="text-2xl font-inter font-bold tracking-tight text-foreground-default md:text-3xl">
              Painel de Controle
            </h2>
          </div>
        </header>

        <div className="mx-auto flex flex-col items-center gap-6 w-full max-w-[350px] sm:max-w-[470px] lg:min-w-[940px] xl:max-w-[1200px]">
          {/* Revenue Overview */}
          {/* TODO: implementar a inteligencia da API para alimentar as infos */}
          <section className="flex flex-col items-center justify-center gap-2 lg:gap-3 xl:gap-4 w-full ">
            <div className="flex flex-row items-center justify-between px-2 w-full ">
              <div className="flex flex-row items-center gap-2">
                <h3 className="text-xl md:text-2xl lg:text-3xl font-semibold font-inter tracking-tight text-foreground-default">
                  Olá, {userMetadata.name}
                </h3>

                <Image
                  src={isShowValues ? OpenedEye : ClosedEye}
                  onClick={() => setIsShowValues(!isShowValues)}
                  alt={isShowValues ? "Mostrar valores" : "Esconder valores"}
                  className="h-6 w-6 lg:h-7 lg:w-7 xl:h-8 xl:w-8 text-secondary cursor-pointer mr-4"
                />
              </div>

              <p className="text-sm lg:text-base font-inter text-foreground-white">
                {today}
              </p>
            </div>

            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 items-center justify-items-center w-full">
              <Card
                className="
                  w-full
                  min-h-24
                  md:min-h-32
                  lg:min-h-36
                  flex
                  flex-col
                  items-center
                  justify-between
                  overflow-hidden
                  bg-background-card
                  shadow-md
                  transition-all
                  hover:shadow-lg
                  rounded-xl
                  px-6
                  py-2
                  md:py-4
                  lg:py-6
                  gap-3
                "
              >
                <CardHeader className="flex items-center justify-center p-0">
                  <CardTitle className="text-xl lg:text-2xl xl:text-3xl font-medium text-foreground-white">
                    Pedidos hoje
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-between p-0">
                  <span className="text-3xl lg:text-4xl xl:text-5xl font-bold font-inter text-center text-foreground-pureWhite">
                    45
                  </span>
                </CardContent>
              </Card>

              <Card
                className="
                  w-full
                  min-h-24
                  md:min-h-32
                  lg:min-h-36
                  flex
                  flex-col
                  items-center
                  justify-between
                  overflow-hidden
                  bg-background-card
                  shadow-md
                  transition-all
                  hover:shadow-lg
                  rounded-xl
                  px-6
                  py-2
                  md:py-4
                  lg:py-6
                  gap-3
                "
              >
                <CardHeader className="flex items-center justify-center p-0">
                  <CardTitle className="text-xl lg:text-2xl xl:text-3xl font-medium text-foreground-white">
                    Faturamento hoje
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-row items-center justify-center gap-2 p-0">
                  <Image
                    src={DollarSignIcon}
                    className="h-6 w-6 lg:h-7 lg:w-7 xl:h-8 xl:w-8 text-secondary"
                    alt={""}
                  />
                  <span className="text-3xl lg:text-4xl xl:text-5xl font-bold font-inter text-center text-foreground-pureWhite">
                    {isShowValues ? (
                      "R$ 2.180,00"
                    ) : (
                      <span className="h-6 w-6 lg:h-7 lg:w-7 xl:h-8 xl:w-8 text-secondary animate-pulse">
                        ****
                      </span>
                    )}
                  </span>
                </CardContent>
              </Card>

              <Card
                className="
                  w-full
                  min-h-24
                  md:min-h-32
                  lg:min-h-36
                  flex
                  flex-col
                  items-center
                  justify-between
                  overflow-hidden
                  bg-background-card
                  shadow-md
                  transition-all
                  hover:shadow-lg
                  rounded-xl
                  px-6
                  py-2
                  md:py-4
                  lg:py-6
                  gap-3
                "
              >
                <CardHeader className="flex items-center justify-center p-0">
                  <CardTitle className="text-xl lg:text-2xl xl:text-3xl text-center font-medium text-foreground-white">
                    Tempo de médio de preparo
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-between p-0">
                  <span className="text-3xl lg:text-4xl xl:text-5xl font-bold font-inter text-center text-foreground-pureWhite">
                    14 min
                  </span>
                </CardContent>
              </Card>

              <Card
                className="
                  w-full
                  min-h-24
                  md:min-h-32
                  lg:min-h-36
                  flex
                  flex-col
                  items-center
                  justify-between
                  overflow-hidden
                  bg-background-card
                  shadow-md
                  transition-all
                  hover:shadow-lg
                  rounded-xl
                  px-6
                  py-2
                  md:py-4
                  lg:py-6
                  gap-3
                "
              >
                <CardHeader className="flex items-center justify-center p-0">
                  <CardTitle className="text-xl lg:text-2xl xl:text-3xl font-medium text-foreground-white">
                    Avaliação média
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-row gap-3 items-center p-0">
                  <Image
                    src={AvaliationStar}
                    className="h-6 w-6 lg:h-7 lg:w-7 xl:h-8 xl:w-8 text-secondary"
                    alt={""}
                  />
                  <span className="text-3xl lg:text-4xl xl:text-5xl font-bold font-inter text-center text-foreground-pureWhite">
                    4,7
                  </span>
                </CardContent>
              </Card>
            </div>
          </section>

          <div className="flex flex-col lg:flex-row gap-4 w-full ">
            {/* Recent Activity Section */}
            {/* TODO: implementar o item mais pedido da noite */}
            <section className="gap-4 lg:gap-5 xl:gap-6 flex flex-col items-center border justify-center bg-background-card w-full py-4 rounded-xl">
              <div className="flex flex-row items-center justify-between w-full px-3">
                <h3 className="text-xl lg:text-2xl xl:text-3xl font-medium text-foreground-white">
                  Pedidos Recentes
                </h3>

                <Link
                  className="
                    text-sm
                    lg:text-base
                    xl:text-lg
                    font-inter
                    font-light
                    text-foreground-about
                    hover:text-foreground-green
                    hover:underline
                    hover:decoration-foreground-green
                    hover:decoration-1
                    hover:underline-offset-4
                    transition-all
                    200ms
                    ease-in-out
                  "
                  href={""}
                >
                  ver mais
                </Link>
              </div>

              <div className="w-full flex flex-col items-center justify-center gap-3 lg:gap-4 px-3">
                <div className="w-full grid grid-cols-4 items-center justify-center gap-2 text-sm md:text-base xl:text-lg font-semibold text-foreground-white px-2">
                  <div className="flex items-center justify-start">Pedido</div>
                  <div className="flex items-center justify-center">Mesa</div>
                  <div className="flex items-center justify-center">Status</div>
                  <div className="flex items-center justify-end">Total</div>
                </div>

                <div className="w-full text-xs font-inter flex flex-col items-center justify-center gap-3 lg:gap-4">
                  <div className="w-full grid grid-cols-4 items-center justify-center gap-2 text-sm md:text-base xl:text-lg text-foreground-white px-0 sm:px-2">
                    <div className="flex items-center justify-start">#001</div>
                    <div className="flex items-center justify-center">01</div>
                    <div className="flex items-center justify-center">
                      <StatusComponent status={Status.PENDING} />
                    </div>
                    <div className="flex items-center justify-end">
                      R$ 45,00
                    </div>
                  </div>
                  <Separator className="w-full bg-border-about/35" />

                  <div className="w-full grid grid-cols-4 items-center justify-center gap-2 text-sm md:text-base xl:text-lg text-foreground-white px-0 sm:px-2">
                    <div className="flex items-center justify-start">#002</div>
                    <div className="flex items-center justify-center">02</div>
                    <div className="flex items-center justify-center">
                      <StatusComponent status={Status.COMPLETED} />
                    </div>
                    <div className="flex items-center justify-end">
                      R$ 45,00
                    </div>
                  </div>
                  <Separator className="w-full bg-border-about/35" />

                  <div className="w-full grid grid-cols-4 items-center justify-center gap-2 text-sm md:text-base xl:text-lg text-foreground-white px-0 sm:px-2">
                    <div className="flex items-center justify-start">#003</div>
                    <div className="flex items-center justify-center">03</div>
                    <div className="flex items-center justify-center">
                      <StatusComponent status={Status.CANCELLED} />
                    </div>
                    <div className="flex items-center justify-end">
                      R$ 45,00
                    </div>
                  </div>
                  <Separator className="w-full bg-border-about/35" />

                  <div className="w-full grid grid-cols-4 items-center justify-center gap-2 text-sm md:text-base xl:text-lg text-foreground-white px-0 sm:px-2">
                    <div className="flex items-center justify-start">#004</div>
                    <div className="flex items-center justify-center">04</div>
                    <div className="flex items-center justify-center">
                      <StatusComponent status={Status.IN_PROGRESS} />
                    </div>
                    <div className="flex items-center justify-end">
                      R$ 45,00
                    </div>
                  </div>
                  <Separator className="w-full bg-border-about/35" />
                </div>
              </div>
            </section>

            {/* Recent table occupation */}
            {/* TODO: implementar o item mais pedido da noite */}
            <section className="gap-4 flex flex-col items-center justify-center bg-background-card w-full rounded-xl">
              <TableOccupancyComponent />
            </section>
          </div>

          {/* Mais pedidos Section */}
          {/* TODO: implementar os intes mais pedidos */}
          <section className="gap-4 lg:gap-5 xl:gap-6 flex flex-col items-center border justify-center bg-background-card w-full py-4 rounded-xl">
            <div className="flex flex-row items-center justify-between w-full px-3">
              <h3 className="text-xl lg:text-2xl xl:text-3xl font-medium text-foreground-white">
                Mais pedidos
              </h3>

              <Link
                className="
                    text-sm
                    lg:text-base
                    xl:text-lg
                    font-inter
                    font-light
                    text-foreground-about
                    hover:text-foreground-green
                    hover:underline
                    hover:decoration-foreground-green
                    hover:decoration-1
                    hover:underline-offset-4
                    transition-all
                    200ms
                    ease-in-out
                  "
                href={""}
              >
                ver mais
              </Link>
            </div>

            <div className="w-full flex flex-col items-center justify-center gap-3 px-3">
              <div className="w-full flex flex-row items-center justify-center gap-2">
                <div className="text-sm md:text-base xl:text-lg font-semibold flex flex-1 flex-row gap-1 w-full items-center justify-between text-foreground-white px-2">
                  <p className="">Item</p>
                  <p className="">Vezes</p>
                </div>
              </div>

              <div className="w-full text-xs font-inter flex flex-col items-center justify-between gap-3">
                <div className="text-sm md:text-base xl:text-lg text-foreground-white flex flex-row gap-1 w-full items-center justify-between px-2">
                  <p className=" ">X-Burguer</p>
                  <p className=" ">94</p>
                </div>
                <Separator className="w-full bg-border-about/35" />
                <div className="text-sm md:text-base xl:text-lg text-foreground-white flex flex-row gap-1 w-full items-center justify-between px-2">
                  <p className=" ">Pizza Calabresa</p>
                  <p className=" ">37</p>
                </div>
                <Separator className="w-full bg-border-about/35" />
                <div className="text-sm md:text-base xl:text-lg text-foreground-white flex flex-row gap-1 w-full items-center justify-between px-2">
                  <p className=" ">Salada Ceasar</p>
                  <p className=" ">30</p>
                </div>
                <Separator className="w-full bg-border-about/35" />
                <div className="text-sm md:text-base xl:text-lg text-foreground-white flex flex-row gap-1 w-full items-center justify-between px-2">
                  <p className=" ">Coca-cola</p>
                  <p className=" ">25</p>
                </div>
                <Separator className="w-full bg-border-about/35" />
                <div className="text-sm md:text-base xl:text-lg text-foreground-white flex flex-row gap-1 w-full items-center justify-between px-2">
                  <p className=" ">Pudim</p>
                  <p className=" ">23</p>
                </div>
                <Separator className="w-full bg-border-about/35" />
              </div>
            </div>
          </section>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

