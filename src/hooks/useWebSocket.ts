import { useEffect, useRef, useState } from 'react';

const useWebSocket = (url: string) => {
  const [messages, setMessages] = useState<string[]>([]);
  const webSocketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    console.log('Connecting to WebSocket:', url);
    webSocketRef.current = new WebSocket(url);

    webSocketRef.current.onopen = () => {
      console.log('WebSocket connection established');
    };

    webSocketRef.current.onmessage = (event) => {
      setMessages((prevMessages) => [...prevMessages, event.data]);
    };

    webSocketRef.current.onclose = () => {
      console.log('WebSocket connection closed');
    };

    webSocketRef.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => {
      webSocketRef.current?.close();
    };
  }, [url]);

  const sendMessage = (message: string) => {
    webSocketRef.current?.send(message);
  };

  return { messages, sendMessage };
};

export default useWebSocket;