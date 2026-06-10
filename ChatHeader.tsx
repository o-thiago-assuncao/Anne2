import { ArrowLeft, Phone, Video, MoreVertical } from "lucide-react";
import avatar from "@/assets/anne-avatar.jpg";

export function ChatHeader() {
  return (
    <header
      className="sticky top-0 z-10 flex items-center gap-3 px-3 py-2.5 text-white shadow-lg"
      style={{ backgroundColor: "#8d1759" }}
    >
      <button className="-ml-1 rounded-full p-1.5 transition hover:bg-white/10" aria-label="Retour">
        <ArrowLeft className="h-5 w-5" />
      </button>
      <div className="relative">
        <img
          src={avatar}
          alt="Madame Anne"
          width={42}
          height={42}
          className="h-[42px] w-[42px] rounded-full object-cover ring-2 ring-white/40"
        />
        <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-[var(--chat-header)]" />
      </div>
      <div className="flex-1 leading-tight">
        <div className="text-[15px] font-semibold tracking-wide">Madame Anne</div>
        <div className="text-[11px] font-medium text-white/80">en ligne</div>
      </div>
      <div className="flex items-center gap-1.5 text-white/85">
        <button className="rounded-full p-2 transition hover:bg-white/10" aria-label="Appel vidéo">
          <Video className="h-[18px] w-[18px]" />
        </button>
        <button className="rounded-full p-2 transition hover:bg-white/10" aria-label="Appel">
          <Phone className="h-[18px] w-[18px]" />
        </button>
        <button className="rounded-full p-2 transition hover:bg-white/10" aria-label="Plus">
          <MoreVertical className="h-[18px] w-[18px]" />
        </button>
      </div>
    </header>
  );
}
