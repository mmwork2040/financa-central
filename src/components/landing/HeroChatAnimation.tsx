import React, { useState, useEffect, useRef } from "react";
import { Bot, User } from "lucide-react";

interface ChatMessage {
  message: string;
  isBot: boolean;
  time: string;
}

const messages: ChatMessage[] = [
  { isBot: true, message: "Olá! Sou sua assistente financeira. Como posso ajudar?", time: "09:41" },
  { isBot: false, message: "Paguei R$ 1.200 de aluguel hoje no Pix", time: "09:42" },
  { isBot: true, message: "✅ Lançamento registrado! Despesa de R$ 1.200,00 — Aluguel, pago via Pix em 04/03/2026.", time: "09:42" },
  { isBot: false, message: "Qual meu saldo do mês?", time: "09:43" },
  { isBot: true, message: "📊 Seu saldo em março: Receitas R$ 18.500 | Despesas R$ 8.200 | Saldo R$ 10.300. Quer um relatório detalhado?", time: "09:43" },
];

const TYPING_SPEED = 18; // ms per character
const PAUSE_BETWEEN = 600; // ms between messages
const TYPING_INDICATOR_DURATION = 500; // ms to show "..." before typing

const TypingIndicator = ({ isBot }: { isBot: boolean }) => (
  <div className={`flex gap-2 ${isBot ? "justify-start" : "justify-end"}`}>
    {isBot && (
      <div className="h-7 w-7 rounded-full bg-primary/15 flex items-center justify-center shrink-0 mt-1">
        <Bot className="h-4 w-4 text-primary" />
      </div>
    )}
    <div
      className={`rounded-2xl px-3 py-2.5 ${
        isBot ? "bg-muted rounded-tl-sm" : "bg-primary rounded-tr-sm"
      }`}
    >
      <div className="flex items-center gap-1">
        <span className="h-1.5 w-1.5 rounded-full bg-current opacity-40 animate-bounce" style={{ animationDelay: "0ms" }} />
        <span className="h-1.5 w-1.5 rounded-full bg-current opacity-40 animate-bounce" style={{ animationDelay: "150ms" }} />
        <span className="h-1.5 w-1.5 rounded-full bg-current opacity-40 animate-bounce" style={{ animationDelay: "300ms" }} />
      </div>
    </div>
    {!isBot && (
      <div className="h-7 w-7 rounded-full bg-primary/15 flex items-center justify-center shrink-0 mt-1">
        <User className="h-4 w-4 text-primary" />
      </div>
    )}
  </div>
);

const AnimatedBubble = ({
  message,
  isBot,
  time,
  typedLength,
  isComplete,
}: ChatMessage & { typedLength: number; isComplete: boolean }) => {
  const displayText = isComplete ? message : message.slice(0, typedLength);

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
        <p>
          {displayText}
          {!isComplete && (
            <span className="inline-block w-[2px] h-3 bg-current ml-0.5 animate-pulse align-middle" />
          )}
        </p>
        {isComplete && time && (
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

const HeroChatAnimation = () => {
  const [currentMsgIndex, setCurrentMsgIndex] = useState(0);
  const [typedLength, setTypedLength] = useState(0);
  const [phase, setPhase] = useState<"typing-indicator" | "typing" | "pause" | "done">("typing-indicator");
  const [completedMessages, setCompletedMessages] = useState<number[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [typedLength, currentMsgIndex, phase]);

  useEffect(() => {
    if (currentMsgIndex >= messages.length) {
      setPhase("done");
      return;
    }

    const currentMsg = messages[currentMsgIndex];

    if (phase === "typing-indicator") {
      const timer = setTimeout(() => {
        setPhase("typing");
        setTypedLength(0);
      }, TYPING_INDICATOR_DURATION);
      return () => clearTimeout(timer);
    }

    if (phase === "typing") {
      if (typedLength < currentMsg.message.length) {
        const timer = setTimeout(() => {
          setTypedLength((prev) => prev + 1);
        }, TYPING_SPEED);
        return () => clearTimeout(timer);
      } else {
        // Message complete
        setCompletedMessages((prev) => [...prev, currentMsgIndex]);
        setPhase("pause");
      }
    }

    if (phase === "pause") {
      const timer = setTimeout(() => {
        setCurrentMsgIndex((prev) => prev + 1);
        setTypedLength(0);
        setPhase("typing-indicator");
      }, PAUSE_BETWEEN);
      return () => clearTimeout(timer);
    }
  }, [currentMsgIndex, typedLength, phase]);

  return (
    <div ref={scrollRef} className="px-3 py-3 space-y-2.5 overflow-y-auto max-h-[380px] touch-none pointer-events-none">
      {messages.map((msg, idx) => {
        if (idx > currentMsgIndex) return null;

        const isCompleted = completedMessages.includes(idx);

        if (idx === currentMsgIndex && phase === "typing-indicator") {
          return <TypingIndicator key={idx} isBot={msg.isBot} />;
        }

        return (
          <AnimatedBubble
            key={idx}
            {...msg}
            typedLength={idx === currentMsgIndex ? typedLength : msg.message.length}
            isComplete={isCompleted}
          />
        );
      })}
    </div>
  );
};

export default HeroChatAnimation;
