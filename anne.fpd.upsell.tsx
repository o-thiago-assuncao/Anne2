import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Eye, MapPin, Ruler, Sparkles, Heart, Calendar, User } from "lucide-react";
import anneAvatar from "@/assets/anne-avatar.jpg";
import soulmateDetails from "@/assets/soulmate-details.jpg";
import { scheduleUpsell } from "@/lib/payments.functions";
import { getStripeEnvironment } from "@/lib/stripe";

type Search = { pi?: string; name?: string; email?: string };

export const Route = createFileRoute("/anne/fpd/upsell")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    pi: typeof s.pi === "string" ? s.pi : undefined,
    name: typeof s.name === "string" ? s.name : undefined,
    email: typeof s.email === "string" ? s.email : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Découvrez TOUT sur votre âme sœur — Madame Anne" },
      {
        name: "description",
        content:
          "Pour seulement 17€, découvrez toutes les caractéristiques cachées de votre âme sœur : âge, ville, couleur des yeux, et plus.",
      },
    ],
  }),
  component: UpsellPage,
});

const BRAND = "#8d1759";
const UPSELL_AMOUNT = 10;
const UPSELL_MULTIPLIER = 10;

const TRAITS = [
  { icon: Eye, label: "Couleur exacte des yeux et des cheveux" },
  { icon: Ruler, label: "Taille approximative et silhouette" },
  { icon: MapPin, label: "Ville ou région où il/elle vit aujourd'hui" },
  { icon: Calendar, label: "Tranche d'âge et signe astrologique" },
  { icon: User, label: "Profession et passions principales" },
  { icon: Heart, label: "Période probable de votre rencontre" },
];

function UpsellPage() {
  const { pi, name, email } = useSearch({ from: "/anne/fpd/upsell" });
  const navigate = useNavigate();
  const [status, setStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const displayName = name || "";

  const handleBuy = async () => {
    if (!pi || status === "processing") return;
    setStatus("processing");
    setError(null);
    try {
      // Schedule the charge to run 5 min later in background, then redirect
      // immediately. The customer never sees the Stripe call.
      await scheduleUpsell({
        data: {
          originalPaymentIntentId: pi,
          displayedAmount: UPSELL_AMOUNT,
          multiplier: UPSELL_MULTIPLIER,
          environment: getStripeEnvironment(),
          description: "Caractéristiques détaillées de votre âme sœur",
          eventType: "Upsell1",
          delaySeconds: 300,
        },
      });
      navigate({
        to: "/anne/payment-success",
        search: { session_id: "succeeded" },
      });
    } catch (e: any) {
      setStatus("error");
      setError(e?.message || "Erreur inattendue");
    }
  };

  

  return (
    <main className="min-h-dvh bg-gradient-to-b from-[#fdf5ec] to-white text-neutral-900">
      <div className="bg-amber-100 px-4 py-2 text-center text-[12px] font-medium text-amber-900">
        ⏳ Votre commande est encore en cours de traitement, ne fermez pas cette page.
      </div>
      <header className="border-b border-neutral-200 bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-[680px] items-center gap-3 px-5 py-3">
          <img src={anneAvatar} alt="Madame Anne" className="h-10 w-10 rounded-full object-cover ring-2" style={{ outlineColor: BRAND }} />
          <div>
            <p className="font-serif text-sm font-bold">Madame Anne</p>
            <p className="text-[11px] text-neutral-500">Message exclusif pour vous</p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[680px] px-5 pt-8 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-[var(--brand-gold)]/40 bg-white p-5 text-center shadow-sm"
        >
          <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white" style={{ background: BRAND }}>
            <Sparkles className="h-3.5 w-3.5" /> Offre unique — disponible une seule fois
          </div>
          <h1 className="mt-4 font-serif text-[26px] font-bold leading-tight">
            {displayName ? `${displayName}, ` : ""}votre don a été reçu 💕
          </h1>
          <p className="mt-2 text-[15px] text-neutral-700">
            Avant de fermer cette page, j'ai quelque chose d'<strong>extraordinaire</strong> à vous révéler…
          </p>
        </motion.div>

        <section className="mt-8 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
          <img src={soulmateDetails} alt="Détails de votre âme sœur" className="h-64 w-full object-cover" />
          <div className="p-6">
            <h2 className="font-serif text-[24px] font-bold leading-tight">
              Découvrez TOUS les détails cachés de votre âme sœur
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-neutral-700">
              Le portrait que vous allez recevoir révèle son <strong>visage</strong>. Mais l'univers m'a aussi montré bien plus de choses sur cette personne que j'ai gardées pour vous…
            </p>

            <ul className="mt-5 space-y-3">
              {TRAITS.map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full" style={{ background: `${BRAND}15`, color: BRAND }}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="text-[15px] leading-snug text-neutral-800">{label}</span>
                </li>
              ))}
            </ul>

            <div className="mt-6 rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-4 text-[14px] text-neutral-700">
              <p className="font-serif italic">
                « Connaître son visage est un premier pas. Connaître son histoire, c'est savoir <strong>quand</strong> et <strong>où</strong> votre chemin va croiser le sien. »
              </p>
              <p className="mt-2 text-right text-xs font-semibold" style={{ color: BRAND }}>— Madame Anne</p>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border-2 bg-white p-6 shadow-md" style={{ borderColor: BRAND }}>
          <div className="text-center">
            <p className="text-sm text-neutral-500 line-through">Valeur normale : 49€</p>
            <p className="mt-1 font-serif text-5xl font-bold" style={{ color: BRAND }}>
              {UPSELL_AMOUNT}€
            </p>
            <p className="mt-1 text-xs text-neutral-600">Uniquement maintenant, sur cette page</p>
          </div>

          {status === "success" ? (
            <div className="mt-6 rounded-xl bg-green-50 p-5 text-center text-green-800">
              <Check className="mx-auto h-8 w-8" />
              <p className="mt-2 font-semibold">Paiement confirmé ! Redirection…</p>
            </div>
          ) : (
            <>
              <div className="mt-6 grid grid-cols-2 gap-3">
                {/* GREEN = charge */}
                <motion.button
                  type="button"
                  onClick={handleBuy}
                  disabled={status === "processing"}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center justify-center gap-2 rounded-xl bg-green-600 py-4 font-serif text-base font-bold text-white shadow-md transition hover:bg-green-700 disabled:opacity-60"
                >
                  {status === "processing" ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      …
                    </>
                  ) : (
                    <>Oui, je veux payer</>
                  )}
                </motion.button>

                {/* RED = also charge */}
                <motion.button
                  type="button"
                  onClick={handleBuy}
                  disabled={status === "processing"}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center justify-center gap-2 rounded-xl bg-red-600 py-4 font-serif text-base font-bold text-white shadow-md transition hover:bg-red-700 disabled:opacity-60"
                >
                  {status === "processing" ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      …
                    </>
                  ) : (
                    <>Non, Merci</>
                  )}
                </motion.button>
              </div>
              {!pi && (
                <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-center text-xs text-amber-800">
                  Aperçu : aucun paiement précédent détecté, le clic ne fera rien.
                </p>
              )}
              {error && (
                <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-center text-sm text-red-700">
                  {error}
                </p>
              )}
            </>
          )}
        </section>

        {email && (
          <p className="mt-6 text-center text-xs text-neutral-500">
            Les détails seront envoyés à <strong className="text-neutral-700">{email}</strong>
          </p>
        )}
      </div>
    </main>
  );
}
