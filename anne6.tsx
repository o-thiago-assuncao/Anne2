import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { ChatHeader } from "@/components/chat/ChatHeader";

export const Route = createFileRoute("/anne6")({
  head: () => ({
    meta: [
      { title: "Madame Anne — Le dessin de votre âme sœur" },
      {
        name: "description",
        content:
          "Découvrez le visage de votre âme sœur dessiné par Madame Anne, médium n°1 en Europe.",
      },
    ],
  }),
  component: Anne6Page,
});

function Anne6Page() {
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const url = "https://cdn.jsdelivr.net/npm/@typebot.io/js@0/dist/web.js";
        const mod: any = await import(/* @vite-ignore */ url);
        if (cancelled) return;
        const Typebot = mod.default ?? mod;
        Typebot.initStandard({ typebot: "s-l-m-f-r-bt-jarhzws" });
      } catch (e) {
        console.error("[typebot] failed to load", e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex h-dvh flex-col bg-white">
      <ChatHeader />
      <div className="flex-1 overflow-hidden">
        {/* @ts-expect-error custom element */}
        <typebot-standard style={{ width: "100%", height: "100%" }} />
      </div>
    </div>
  );
}
