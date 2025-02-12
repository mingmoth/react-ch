import { useCallback, useEffect } from 'react';
import { useCryptoWebSocket } from '../contexts/CryptoWSContext';
import { wsSubscribeMethod, wsUnSubscribeMethod } from "../configs/cryptoWSConfig";

export function useCryptoWSChannelSubscribe(channel: string, handleWSFn: (data: any[]) => void) {
  if(!channel || typeof handleWSFn !== 'function') {
    console.error("useCryptoWSChannelSubscribe init error")
    return;
  }

  const handleWSChannelMsg = useCallback((event: MessageEvent) => {
    try {
      const msg = JSON.parse(event.data)
      if(msg?.method === wsSubscribeMethod) {
        if(msg?.result?.channel && msg?.result?.data && msg?.result?.subscription) {
          const { channel: websocketChannel, subscription, data } = msg?.result;
          if (channel.startsWith(websocketChannel)
            && subscription === channel
            && data
          ) {
            return handleWSFn(data);
          }
        }
        
      }
      return null;
    } catch (error) {
      console.error("Error processing WebScoket Order Book message:", error);
      return null;
    }
  }, [channel])

  const { socket } = useCryptoWebSocket()

  function subscribeWSChannel(channel: string) {
    if(!socket) return
    console.log('subscribe', channel)
    socket.send(JSON.stringify({
      method: wsSubscribeMethod,
      params: { channels: channel },
    }))
  }
  
  function unsubscribeWSChannel(channel: string) {
    if(!socket) return
    console.log('unsubscribe', channel)
    socket.send(JSON.stringify({
      method: wsUnSubscribeMethod,
      params: { channels: channel },
    }))
  }

  useEffect(() => {
    if(!socket) return
    try {
      if(socket.readyState === WebSocket.OPEN) {
        subscribeWSChannel(channel)
      } else {
        console.warn("Socket is not open. Current readyState:", socket.readyState);
      }
    } catch (err) {
      console.error("Failed to send subscription message:", err);
    }

    socket.addEventListener("message", handleWSChannelMsg)
    
    return (() => {
      try {
        if (socket.readyState === WebSocket.OPEN) {
          unsubscribeWSChannel(channel);
        }
      } catch (err) {
        console.error("Failed to send unsubscribe message:", err);
      }
      socket.removeEventListener("message", handleWSChannelMsg)

    })
  }, [socket])
}