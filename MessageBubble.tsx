import { motion } from "framer-motion";
import { Check, CheckCheck } from "lucide-react";
import avatar from "@/assets/anne-avatar.jpg";
import { cn } from "@/lib/utils";

type Props = {
  from: "bot" | "user";
  showAvatar?: boolean;
  children: React.ReactNode;
  noPadding?: boolean;
};

const time = () =>
  new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

export function MessageBubble({ from, showAvatar, children, noPadding }: Props) {
  const isBot = from === "bot";
  return (
    <motion.div
      initial={{ opacity: 0, y: 6, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      className={cn("flex w-full items-end gap-2", isBot ? "justify-start" : "justify-end")}
    >
      {isBot && (
        <div className="w-8 shrink-0">
          {showAvatar && (
            <img
              src={avatar}
              alt=""
              className="h-8 w-8 rounded-full object-cover ring-1 ring-black/5"
            />
          )}
        </div>
      )}
      <div
        className={cn(
          "relative max-w-[82%] rounded-2xl text-[14.5px] leading-relaxed shadow-[0_1px_1.5px_rgba(0,0,0,0.12)]",
          noPadding ? "overflow-hidden" : "px-3 py-2 pr-16",
          isBot
            ? "bubble-tail-bot bg-chat-bubble-bot text-chat-text-bot"
            : "bubble-tail-user bg-chat-bubble-user text-chat-text-bot"
        )}
      >
        {children}
        {!noPadding && (
          <span className="pointer-events-none absolute bottom-1 right-2 flex items-center gap-0.5 text-[10px] text-chat-text-bot/45">
            {time()}
            {!isBot && <CheckCheck className="h-3 w-3 text-sky-500" />}
            {isBot && <Check className="h-3 w-3" />}
          </span>
        )}
      </div>
    </motion.div>
  );
}
