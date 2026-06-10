import { motion } from "framer-motion";
import avatar from "@/assets/anne-avatar.jpg";

export function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-end gap-2"
    >
      <img src={avatar} alt="" className="h-8 w-8 rounded-full object-cover" />
      <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-chat-bubble-bot px-4 py-3 shadow-sm">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="block h-2 w-2 rounded-full bg-chat-text-bot/60"
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </div>
    </motion.div>
  );
}
