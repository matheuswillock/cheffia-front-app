"use client";
import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useRestaurantWebSocket } from "@/services/restaurant/restaurantBusiness";
import {NewOrder} from "@/components/OrderHubContent/NewOrder";
import MoreDetails from "@/components/OrderHubContent/MoreDetails";
import OrderList from "@/components/OrderHubContent/OrderList";

export default function OrderHubPage() {
    const { slug } = useParams();
    const { messages } = useRestaurantWebSocket(slug as string);

    useEffect(() => {
        if (messages.length > 0) {
            console.log("New message received:", messages[messages.length - 1]);
        }
    }, [messages]);

    return (
        <div className="flex min-h-svh flex-col items-center gap-6 flex-1 px-8 my-8 ">
            <div className="flex flex-col flex-initial gap-2 border-b-2 px-2 w-max ">
                <h2 className="text-3xl text-foreground">Central de Pedidos</h2>
            </div>

            <div className="grid grid-cols-4 gap-4 w-[100%] min-h-[80vh] max-h-[80vh] border-2 rounded-xl ">
                <div className="border-r-2 col-span-1">
                    
                    <h2 className="text-3xl text-foreground ml-4 my-2">Pedidos</h2>
                    <OrderList messages={messages} />
                </div>

                <div className="col-span-3">
                    <h2 className="text-3xl text-foreground ml-4 my-2">Mais Detalhes</h2>
                    <MoreDetails />
                </div>
            </div>
        </div>

    );
}