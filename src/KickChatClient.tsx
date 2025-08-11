import React, { useEffect, useRef, useState } from "react";
import tmi from "tmi.js";

type ChatMessage = {
  platform: "Twitch" | "Kick";
  username: string;
  message: string;
};

const ChatOverlay: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const outputRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new message
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [messages]);

  // Twitch Chat Setup
  useEffect(() => {
    const twitchClient = new tmi.Client({
      options: { debug: true },
      identity: {
        username: "your_bot_username",
        password: "oauth:your_token"
      },
      channels: ["your_channel"]
    });

    twitchClient.connect();

    twitchClient.on("message", (_channel, tags, message, self) => {
      if (self) return;
      setMessages((prev) => [
        ...prev,
        {
          platform: "Twitch",
          username: tags["display-name"] || tags.username || "Unknown",
          message
        }
      ]);
    });

    return () => {
      twitchClient.disconnect();
    };
  }, []);

  // Kick Chat Setup
  useEffect(() => {
    const wsURL =
      "wss://ws-us2.pusher.com/app/32cbd69e4b950bf97679?protocol=7&client=js&version=8.4.0-rc2&flash=false";
    let socket: WebSocket;

    async function getChatroomID(): Promise<string> {
      const url = "https://kick.com/api/v2/channels/xqc/chatroom";
      const response = await fetch(url);
      const data = await response.json();
      return `chatrooms.${data.id}.v2`;
    }

    async function startKickChat() {
      const chatroom_id = await getChatroomID();
      socket = new WebSocket(wsURL);

      socket.onopen = () => {
        const subscribeMsg = JSON.stringify({
          event: "pusher:subscribe",
          data: { auth: "", channel: chatroom_id }
        });
        socket.send(subscribeMsg);
      };

      socket.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          if (parsed.event === "App\\Events\\ChatMessageEvent") {
            const data = JSON.parse(parsed.data);
            setMessages((prev) => [
              ...prev,
              {
                platform: "Kick",
                username: data.sender.username,
                message: data.content
              }
            ]);
          }
        } catch (err) {
          console.error("Kick message parse error:", err);
        }
      };

      socket.onclose = (event) => {
        console.log("Kick WebSocket closed:", event.code, event.reason);
      };

      socket.onerror = (err) => {
        console.error("Kick WebSocket error:", err);
      };
    }

    startKickChat();

    return () => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close(1000, "Component unmounted");
      }
    };
  }, []);

  return (
    <div style={{ padding: "1rem", background: "#111", color: "#fff", fontFamily: "sans-serif" }}>
      <h2>Live Chat</h2>
      <div
        ref={outputRef}
        style={{
          maxHeight: "400px",
          overflowY: "auto",
          border: "1px solid #444",
          padding: "0.5rem"
        }}
      >
        {messages.map((msg, idx) => (
          <p key={idx}>
            <strong>[{msg.platform}] {msg.username}:</strong> {msg.message}
          </p>
        ))}
      </div>
    </div>
  );
};

export default ChatOverlay;