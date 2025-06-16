"use client";

import { useEffect } from "react";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import LogoGreen from "../../../../public/assets/Icons/simbolo-verde.png"
import { Button } from "@/components/ui/button";
import { useParams } from "next/navigation";
import { OrdersBoard } from "./container/OrdersBoard";
import { useWebSocket } from "@/hooks/CheffiaFlowHooks/useWebSocket";

export default function Page() {
  const { slug } = useParams();
  const { orders, status, setOrders } = useWebSocket(slug as string);

  function handleStatusChange(
    orderId: string,
    orderItemNumber: number,
    newStatus: string
  ) {
    setOrders((prev) =>
      prev.map((order) =>
        order.customerOrderId === orderId
          ? {
              ...order,
              orderItems: order.orderItems.map((item) =>
                item.orderNumber === orderItemNumber
                  ? { ...item, orderItemStatus: newStatus }
                  : item
              ),
            }
          : order
      )
    );
    console.debug(
      `Status do item ${orderItemNumber} do pedido ${orderId} alterado para ${newStatus}`
    );
  }

  if (!slug) {
    return <div>Restaurante não encontrado!</div>;
  }

  useEffect(() => {
    if (orders.length === 0) {
      console.log("Nenhum pedido recebido ainda.");
    } else {
      console.log(`Total de pedidos recebidos: ${orders.length}`);
      orders.forEach((order) => {
        console.log(`Pedido ID: ${order.customerOrderId}, Status: ${order.orderStatus}`);
      });
    }
  }, [orders, setOrders]);

  return (
    <div className="flex flex-col items-center w-screen h-screen ">
      <header className="w-full flex items-center flex-col gap-3 justify-between p-4 shadow-md">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center flex-row gap-2">
            <Image
              src={LogoGreen}
              alt="Cheffia Flow"
              width={500}
              height={300}
              className="w-10 h-10"
            />
            <h1>Cheffia Flow</h1>
          </div>

          <Button
            className="
                text-base
                font-medium
                font-inter
                bg-background-green
                hover:bg-background-green/90
                text-foreground-black
                rounded-lg
                px-2
                transition-colors
                duration-200
                flex
                items-center
                justify-between
            "
          >
            Dashboard
          </Button>
        </div>

        <div className="flex items-center w-full gap-3 text-foreground-card text-sm font-medium pl-2">
          <p>Pedidos em tempo real</p>
          <Separator orientation="vertical" className="h-5" />
          <p>Cozinha {status === "open" ? "conectada" : "desconectada"}</p>
          <div className="relative flex items-center">
            <span
              className={`absolute inline-flex h-[10px] w-[10px] rounded-full  animate-ping ${
                status === "open" ? "bg-green-500" : "bg-red-500"
              }`}
            />
            <span
              className={`relative inline-flex h-[10px] w-[10px] rounded-full ${
                status === "open" ? "bg-green-500" : "bg-red-500"
              }`}
            />
          </div>
        </div>
      </header>

      <main className="w-full h-screen flex-1 p-4">
        <OrdersBoard orders={orders} onStatusChange={handleStatusChange} />
      </main>
    </div>
  );
}




