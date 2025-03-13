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
      webSocketRef.current?.close();
    };

    const handleBeforeUnload = () => {
      webSocketRef.current?.close();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      webSocketRef.current?.close();
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [url]);

  const sendMessage = (message: string) => {
    webSocketRef.current?.send(message);
  };

  const closeConnection = () => {
    webSocketRef.current?.close();
  };

  return { messages, sendMessage, closeConnection };
};

export default useWebSocket;