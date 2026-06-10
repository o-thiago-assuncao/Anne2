import { createFileRoute } from "@tanstack/react-router";
import { ChatContainer } from "@/components/chat/ChatContainer";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Madame Anne — Le dessin de votre âme sœur" },
      {
        name: "description",
        content:
          "Discutez avec Madame Anne et découvrez le portrait de votre âme sœur en quelques minutes.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return <ChatContainer />;
}
