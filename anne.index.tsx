import { createFileRoute } from "@tanstack/react-router";
import { ChatContainer } from "@/components/chat/ChatContainer";

export const Route = createFileRoute("/anne/")({
  head: () => ({
    meta: [
      { title: "Madame Anne — Le dessin de votre âme sœur" },
      {
        name: "description",
        content:
          "Découvrez le visage de votre âme sœur dessiné par Madame Anne, médium n°1 en Europe.",
      },
      { property: "og:title", content: "Madame Anne — Le dessin de votre âme sœur" },
      {
        property: "og:description",
        content:
          "Découvrez le visage de votre âme sœur dessiné par Madame Anne, médium n°1 en Europe.",
      },
    ],
  }),
  component: AnnePage,
});

function AnnePage() {
  return <ChatContainer />;
}
