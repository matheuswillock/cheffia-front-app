import { NewRequestOrder } from "@/models/cheffiaFlowModels/NewRequestOrder";
import { useCallback, useEffect, useRef, useState } from "react";
const websocketServerUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL as string;

type WebSocketStatus = "connecting" | "open" | "closed" | "error";

export function useWebSocket(slug: string) {
  const [status, setStatus] = useState<WebSocketStatus>("connecting");
  const [orders, setOrders] = useState<NewRequestOrder[]>([]);
  const ws = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const MAX_ATTEMPTS = 5;

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
        const newOrder: NewRequestOrder = JSON.parse(event.data);
        setOrders((prevOrders) => {
          if (prevOrders.some((o) => o.customerOrderId === newOrder.customerOrderId))
            return prevOrders;
          return [...prevOrders, newOrder];
        });
        console.log("📦 Nova ordem recebida:", newOrder);
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

  useEffect(() => {
    connectWebSocket();

    return () => {
      ws.current?.close();
    };
  }, [connectWebSocket]);

  const sendMessage = (message: object) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    }
  };

  return {
    status,
    orders,
    setOrders,
    sendMessage,
  };
}