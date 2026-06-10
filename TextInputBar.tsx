import { useState, type FormEvent } from "react";
import { Send } from "lucide-react";

type Props = {
  placeholder?: string;
  type?: "text" | "email";
  onSubmit: (value: string) => void;
};

export function TextInputBar({ placeholder = "Écris-le ici...", type = "text", onSubmit }: Props) {
  const [value, setValue] = useState("");
  const handle = (e: FormEvent) => {
    e.preventDefault();
    const v = value.trim();
    if (!v) return;
    onSubmit(v);
    setValue("");
  };
  return (
    <form onSubmit={handle} className="flex items-end gap-2">
      <div className="w-8" />
      <div className="flex flex-1 items-center gap-2 rounded-full bg-white/95 px-4 py-2 shadow-md ring-1 ring-black/5 backdrop-blur">
        <input
          autoFocus
          type={type}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-[15px] text-chat-text-bot outline-none placeholder:text-chat-text-bot/40"
        />
        <button
          type="submit"
          disabled={!value.trim()}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[var(--brand-purple)] to-[var(--chat-header)] text-white shadow-md transition active:scale-95 disabled:opacity-40"
          aria-label="Envoyer"
        >
          <Send className="h-4 w-4 -translate-x-[1px]" />
        </button>
      </div>
    </form>
  );
}
