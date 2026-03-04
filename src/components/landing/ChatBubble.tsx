import React from "react";
import { Bot, User } from "lucide-react";

interface ChatBubbleProps {
  message: string;
  isBot?: boolean;
  time?: string;
}

const ChatBubble = ({ message, isBot = false, time = "" }: ChatBubbleProps) => {
  return (
    <div className={`flex gap-2 ${isBot ? "justify-start" : "justify-end"}`}>
      {isBot && (
        <div className="h-7 w-7 rounded-full bg-primary/15 flex items-center justify-center shrink-0 mt-1">
          <Bot className="h-4 w-4 text-primary" />
        </div>
      )}
      <div
        className={`max-w-[75%] rounded-2xl px-3 py-2 text-[11px] leading-relaxed ${
          isBot
            ? "bg-muted text-foreground rounded-tl-sm"
            : "bg-primary text-primary-foreground rounded-tr-sm"
        }`}
      >
        <p>{message}</p>
        {time && (
          <span className={`text-[9px] block mt-0.5 ${isBot ? "text-muted-foreground" : "text-primary-foreground/70"}`}>
            {time}
          </span>
        )}
      </div>
      {!isBot && (
        <div className="h-7 w-7 rounded-full bg-primary/15 flex items-center justify-center shrink-0 mt-1">
          <User className="h-4 w-4 text-primary" />
        </div>
      )}
    </div>
  );
};

export default ChatBubble;
