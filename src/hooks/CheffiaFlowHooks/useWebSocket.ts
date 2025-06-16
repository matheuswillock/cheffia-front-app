import { NewRequestOrder } from "@/models/cheffiaFlowModels/NewRequestOrder";
import { OrderItem } from "@/models/cheffiaFlowModels/OrderItem";
import { useCallback, useEffect, useRef, useState } from "react";
import { InputEventToSend } from "./models/InputEventToSend";
const websocketServerUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL as string;

function mapOrderItem(data: any): OrderItem {
  return {
    orderNumber: data.orderNumber ?? data.OrderNumber,
    itemName: data.itemName ?? data.ItemName,
    quantity: data.quantity ?? data.Quantity,
    comments: data.comments ?? data.Comments,
    tableNumber: data.tableNumber ?? data.TableNumber,
    dispatchDate: new Date(data.dispatchDate ?? data.DispatchDate),
    price: data.price ?? data.Price,
    orderItemStatus: data.orderItemStatus ?? data.Status ?? "Received",
  } as OrderItem;
}

function mapOrder(data: any): NewRequestOrder {
  return {
    customerOrderId: data.customerOrderId ?? data.CustomerOrderId,
    restaurantId: data.restaurantId ?? data.RestaurantId,
    orderDate: new Date(data.orderDate ?? data.OrderDate),
    paymentStatus: data.paymentStatus ?? data.PaymentStatus,
    totalToPay: data.totalToPay ?? data.TotalToPay,
    orderItems: (data.orderItems ?? data.OrderItems ?? []).map(mapOrderItem),
    tableNumber: data.tableNumber ?? data.TableNumber,
    orderStatus: data.orderStatus ?? data.OrderStatus ?? "recebido",
    orderNumber: data.orderNumber ?? data.OrderNumber,
  } as NewRequestOrder;
}

type WebSocketStatus = "connecting" | "open" | "closed" | "error";

export function useWebSocket(slug: string) {
  const [status, setStatus] = useState<WebSocketStatus>("connecting");
  const [orders, setOrders] = useState<NewRequestOrder[]>([]);
  const ws = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const MAX_ATTEMPTS = 5;
  const heartbeatInterval = useRef<NodeJS.Timeout | null>(null);

  const connectWebSocket = useCallback(() => {
    const url = `${websocketServerUrl}/OrderHub/connection/${slug}`;
    console.log(`🔌 Tentando conectar ao WebSocket em: ${url}`);
    if (ws.current) {
      ws.current.close();
      console.log("🔌 WebSocket fechado antes de reconectar.");
    }
    console.log(`🔌 Conectando ao WebSocket em: ${url}`);
    ws.current = new WebSocket(url);
    
    ws.current.onopen = () => {
      setStatus("open");
      console.log("🔌 WebSocket aberto!");
    };

    ws.current.onmessage = (event) => {
      try {
        const raw = JSON.parse(event.data);
        const parsedOrder = mapOrder(raw);

        setOrders((prevOrders) => {
          if (prevOrders.some((o) => o.customerOrderId === parsedOrder.customerOrderId))
            return prevOrders;
          return [...prevOrders, parsedOrder];
        });
        console.log("📦 Nova ordem recebida:", parsedOrder);
      } catch (error) {
        console.error("Erro ao parsear mensagem recebida:", error);
      }
    };

    ws.current.onerror = (error) => {
      setStatus("error");
      console.error("❗ Erro no WebSocket:", error);
    };

    ws.current.onclose = (event) => {
      setStatus("closed");

      if (event.reason === "Restaurant does not exist") {
        console.error("Restaurante não existe!");
        setStatus("restaurant_not_found" as WebSocketStatus);
      } else if (event.reason === "Already connected") {
        console.error("Já existe uma conexão ativa para este restaurante!");
        setStatus("already_connected" as WebSocketStatus);
      } else {
        if (reconnectAttempts.current < MAX_ATTEMPTS) {
          reconnectAttempts.current += 1;
          console.log(`🔌 WebSocket fechado. Tentativa ${reconnectAttempts.current}/${MAX_ATTEMPTS}...`);
          setTimeout(connectWebSocket, 3000);
        } else {
          console.error("Máximo de tentativas atingido. WebSocket desconectado permanentemente.");
        }
      }
    };
  }, [slug]);

  const sendMessage = (message: object) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    }
  };

  useEffect(() => {
    connectWebSocket();

    return () => {
      ws.current?.close();
      if (heartbeatInterval.current) {
        clearInterval(heartbeatInterval.current);
      }
    };
  }, [connectWebSocket]);

  useEffect(() => {
    if (status === "open") {
      heartbeatInterval.current = setInterval(() => {
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
          console.log("🔄 Enviando heartbeat para o backend...");
          ws.current.send(JSON.stringify(
            new InputEventToSend("restaurantId", "Heartbeat", null)
          ));
          console.log("🔄 Heartbeat enviado para o backend");
        }
      }, 80000);
      console.log("🕒 Heartbeat configurado para 80 segundos");
      return () => {
        if (heartbeatInterval.current) {
          clearInterval(heartbeatInterval.current);
        }
      };
    }
  }, [status]);

  return {
    status,
    orders,
    setOrders,
    sendMessage,
  };
}
