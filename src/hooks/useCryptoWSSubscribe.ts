import { useEffect } from 'react';
import { useCryptoWebSocket } from '../contexts/CryptoWSContext';

export default function useCryptoWSSubscribe(subscribeMsg: null | {}, unsubscribeMsg: null | {}, handleWSFn:(event: MessageEvent<any>) => void) {
  if(!subscribeMsg || !unsubscribeMsg || typeof handleWSFn !== 'function') {
    console.error("useCryptoWSOnmessage init error")
    return;
  }
  const { socket } = useCryptoWebSocket()

  useEffect(() => {
    if(!socket) return
    try {
      if(socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(subscribeMsg))
      } else {
        console.warn("Socket is not open. Current readyState:", socket.readyState);
      }
    } catch (err) {
      console.error("Failed to send subscription message:", err);
    }

    socket.addEventListener("message", handleWSFn)
    
    return (() => {
      try {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify(unsubscribeMsg));
        }
      } catch (err) {
        console.error("Failed to send unsubscribe message:", err);
      }
      socket.removeEventListener("message", handleWSFn)

    })
  }, [socket])

}