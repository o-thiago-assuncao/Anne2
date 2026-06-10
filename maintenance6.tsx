import { createFileRoute } from "@tanstack/react-router";
import { MaintenanceSinglePresetPage } from "@/components/MaintenanceSinglePresetPage";

type Search = { name?: string; email?: string };

export const Route = createFileRoute("/maintenance6")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    name: typeof s.name === "string" ? s.name : undefined,
    email: typeof s.email === "string" ? s.email : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Maintenir le consultoire en ligne — Madame Anne" },
      {
        name: "description",
        content:
          "Participez à la maintenance du consultoire en ligne de Madame Anne et recevez le portrait de votre âme sœur.",
      },
    ],
  }),
  component: () => (
    <MaintenanceSinglePresetPage routeId="/maintenance6" multiplier={25} />
  ),
});
