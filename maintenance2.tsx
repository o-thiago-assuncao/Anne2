import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Quote, Sparkles } from "lucide-react";
import anneAvatar from "@/assets/anne-avatar.jpg";
import consultorio from "@/assets/consultorio-anne.jpg";
import couple from "@/assets/testimonial-couple.jpg";
import { StripeCardForm } from "@/components/StripeCardForm";

type Search = { name?: string; email?: string };

export const Route = createFileRoute("/maintenance2")({
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
  component: MaintenancePage,
});

const PRESETS = [10, 25, 50] as const;
const BRAND = "#8d1759";

const equivalence = (amount: number): string => {
  if (amount >= 50) return "🌐 Un mois complet de consultoire en ligne";
  if (amount >= 25) return "🔮 13 jours de consultations spirituelles";
  if (amount >= 10) return "🕯️ 5 jours de présence et d'écoute";
  return "Une aide précieuse pour le consultoire";
};

type DonPriceId = "don_10" | "don_25" | "don_50";

type Attempt =
  | { mode: "fixed"; priceId: DonPriceId; amount: number }
  | { mode: "custom"; amountCents: number; amount: number };

const PRESET_LADDER = [50, 25, 10] as const;

function nextDowngrade(currentAmount: number): Attempt | null {
  const next = PRESET_LADDER.find((p) => p < currentAmount);
  if (!next) return null;
  return { mode: "fixed", priceId: `don_${next}` as DonPriceId, amount: next };
}

function MaintenancePage() {
  const { name: nameParam, email: emailParam } = useSearch({
    from: "/maintenance2",
  });
  const navigate = useNavigate();
  const [selected, setSelected] = useState<number>(50);
  const [name, setName] = useState(nameParam ?? "");
  const [email, setEmail] = useState(emailParam ?? "");

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (nameParam && emailParam) return;
    try {
      const raw = window.localStorage.getItem("quiz_data");
      if (!raw) return;
      const data = JSON.parse(raw) as {
        email?: string;
        name?: string;
        timestamp?: number;
      };
      if (!nameParam && data.name) setName(data.name);
      if (!emailParam && data.email) setEmail(data.email);
    } catch {
      // ignore
    }
  }, [nameParam, emailParam]);

  const [attempts, setAttempts] = useState<Attempt[]>([
    { mode: "fixed", priceId: "don_50", amount: 50 },
  ]);
  const [downgrading, setDowngrading] = useState<{ from: number; to: number } | null>(null);
  const [exhausted, setExhausted] = useState(false);

  const amount = selected;
  const finalEmail = emailParam || email;
  const finalName = nameParam || name;

  const canSubmit =
    amount >= 10 &&
    finalName.trim().length > 1 &&
    /^\S+@\S+\.\S+$/.test(finalEmail);

  const buildInitialAttempt = (amt: number): Attempt => {
    if (amt === 10) return { mode: "fixed", priceId: "don_10", amount: 10 };
    if (amt === 50) return { mode: "fixed", priceId: "don_50", amount: 50 };
    return { mode: "fixed", priceId: "don_25", amount: 25 };
  };

  const handleSelectAmount = (amt: number) => {
    setSelected(amt);
    setAttempts([buildInitialAttempt(amt)]);
    setExhausted(false);
    setDowngrading(null);
  };

  const handleSubmitInfo = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const currentAttempt = attempts[attempts.length - 1];

  const handleFailed = () => {
    if (!currentAttempt) return;
    const next = nextDowngrade(currentAttempt.amount);
    if (!next) {
      setExhausted(true);
      return;
    }
    setDowngrading({ from: currentAttempt.amount, to: next.amount });
    setTimeout(() => {
      setAttempts((a) => [...a, next]);
      setDowngrading(null);
    }, 1800);
  };

  const displayName = nameParam || name || "";

  return (
    <main className="min-h-dvh bg-white text-neutral-900">
      <header className="border-b border-neutral-200">
        <div className="mx-auto max-w-[680px] px-5 py-4 flex items-center gap-2">
          <Sparkles className="h-5 w-5" style={{ color: BRAND }} />
          <span className="font-serif font-bold" style={{ color: BRAND }}>
            Madame Anne — Consultoire en ligne
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-[680px] px-5 pt-8 pb-16">
        {/* Hero */}
        <section className="text-center">
          <div className="flex items-center justify-center">
            <img
              src={anneAvatar}
              alt="Madame Anne"
              className="h-24 w-24 rounded-full border-[3px] object-cover"
              style={{ borderColor: BRAND }}
            />
          </div>
          <p className="mt-4 font-serif italic text-[15px]" style={{ color: BRAND }}>
            ✨ Maintenance du consultoire ✨
          </p>
          <h1 className="mt-3 font-serif text-[28px] font-bold leading-tight">
            {displayName ? `${displayName}, ` : ""}Aidez-Moi à Garder le Consultoire en Ligne
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-neutral-700">
            Mon consultoire en ligne dépend de vous. Votre contribution couvre les frais
            techniques (serveurs, énergie spirituelle, outils de divination) et me permet
            de continuer à dessiner les portraits des âmes sœurs pour les cœurs sincères
            comme le vôtre.
          </p>
        </section>

        {/* Story image */}
        <section className="mt-10 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
          <img
            src={consultorio}
            alt="Le consultoire en ligne de Madame Anne"
            className="h-72 w-full object-cover"
            width={1280}
            height={768}
          />
          <div className="p-6">
            <h2 className="font-serif text-2xl font-bold">Mon sanctuaire numérique</h2>
            <p className="mt-3 text-[15px] leading-relaxed text-neutral-700">
              Chaque jour, des centaines d'âmes me consultent depuis le monde entier. Les
              bougies, les cartes, la boule de cristal — tout cela coûte. Mais
              <strong> maintenir le consultoire en ligne</strong> coûte aussi : les
              serveurs sécurisés, la confidentialité, les outils qui me permettent de
              vous répondre à toute heure.
            </p>
            <p className="mt-4 font-serif italic font-semibold" style={{ color: BRAND }}>
              Votre contribution de {amount}€{" "}
              {amount >= 50
                ? "couvre un mois complet de fonctionnement."
                : amount >= 25
                  ? "couvre 13 jours de consultations en ligne."
                  : "couvre 5 jours de présence à vos côtés."}
            </p>
            <p className="mt-4 text-[15px] leading-relaxed text-neutral-700">
              {displayName ? `${displayName}, ` : ""}sans votre soutien, je ne pourrais
              pas continuer. <em>Et l'univers récompense toujours ceux qui soutiennent
              la lumière.</em>
            </p>
          </div>
        </section>

        {finalEmail && (
          <section className="mt-6 rounded-2xl border border-neutral-200 bg-neutral-50 p-5 text-[14px] text-neutral-700">
            Dès que votre contribution sera confirmée, vous recevrez le portrait de votre
            âme sœur à <strong className="text-neutral-900">{finalEmail}</strong>.
          </section>
        )}

        {/* Payment card */}
        <section className="mt-10 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="font-serif text-[22px] font-bold leading-tight">
            {displayName ? `${displayName}, ` : ""}Choisissez Votre Contribution
          </h2>
          <p className="mt-1 text-sm text-neutral-600">
            100% va directement à la maintenance du consultoire.
          </p>

          <div className="mt-6 grid grid-cols-3 gap-3">
            {PRESETS.map((p) => {
              const active = selected === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => handleSelectAmount(p)}
                  className="relative rounded-xl border-2 bg-white px-3 py-5 text-center font-serif text-2xl font-bold transition"
                  style={{
                    borderColor: active ? BRAND : "#e5e5e5",
                    color: BRAND,
                    boxShadow: active ? `0 0 0 3px ${BRAND}22` : undefined,
                  }}
                >
                  {p === 50 && (
                    <span
                      className="absolute -top-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[10px] font-semibold text-white shadow"
                      style={{ background: BRAND }}
                    >
                      ✨ RECOMMANDÉ
                    </span>
                  )}
                  {p}€
                </button>
              );
            })}
          </div>

          <p className="mt-4 text-center text-sm text-neutral-700">{equivalence(amount)}</p>

          <div className="my-6 border-t border-dashed border-neutral-300" />

          {(!nameParam || !emailParam) && (
            <form onSubmit={handleSubmitInfo} className="space-y-3 mb-4">
              {!nameParam && (
                <div>
                  <label className="mb-1 block text-xs text-neutral-600">Votre prénom</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Prénom"
                    className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-[15px] outline-none focus:border-neutral-900"
                    required
                  />
                </div>
              )}
              {!emailParam && (
                <div>
                  <label className="mb-1 block text-xs text-neutral-600">Votre email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@exemple.com"
                    className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-[15px] outline-none focus:border-neutral-900"
                    required
                  />
                </div>
              )}
            </form>
          )}

          {!canSubmit ? (
            <p className="text-center text-sm text-neutral-600">
              Renseignez votre prénom et votre email pour contribuer {amount}€.
            </p>
          ) : (
            <div>
              <div className="mb-3 flex items-center justify-between text-sm">
                <span className="text-neutral-700">
                  Contribution de{" "}
                  <strong style={{ color: BRAND }}>
                    {currentAttempt?.amount ?? amount}€
                  </strong>
                  {attempts.length > 1 && (
                    <span className="ml-2 text-xs text-neutral-500">
                      (tentative {attempts.length})
                    </span>
                  )}
                </span>
              </div>

              {exhausted ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-center text-sm text-red-800">
                  <p className="font-semibold">
                    Votre carte a été refusée plusieurs fois.
                  </p>
                  <p className="mt-2 text-red-700">
                    Merci d'essayer avec un autre moyen de paiement.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setAttempts([buildInitialAttempt(amount)]);
                      setExhausted(false);
                    }}
                    className="mt-4 rounded-lg px-4 py-2 text-xs font-semibold text-white"
                    style={{ background: BRAND }}
                  >
                    Réessayer avec une autre carte
                  </button>
                </div>
              ) : downgrading ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center gap-3 rounded-xl bg-neutral-50 p-8 text-center"
                >
                  <div
                    className="h-6 w-6 animate-spin rounded-full border-2 border-t-transparent"
                    style={{ borderColor: BRAND, borderTopColor: "transparent" }}
                  />
                  <p className="text-sm text-neutral-700">
                    Le paiement de <strong>{downgrading.from}€</strong> n'a pas été validé.
                    <br />
                    Nous réessayons avec{" "}
                    <strong style={{ color: BRAND }}>{downgrading.to}€</strong>…
                  </p>
                </motion.div>
              ) : currentAttempt?.mode === "fixed" ? (
                <StripeCardForm
                  key={`attempt-${attempts.length}-${currentAttempt.priceId}`}
                  mode="fixed"
                  priceId={currentAttempt.priceId}
                  customerEmail={finalEmail}
                  customerName={finalName}
                  amountLabel={currentAttempt.amount}
                  noMultiplier
                  onSuccess={(paymentIntentId) => {
                    navigate({
                      to: "/anne/fpd/upsell",
                      search: { pi: paymentIntentId, name: finalName, email: finalEmail },
                    });
                  }}
                  onFailed={handleFailed}
                />
              ) : null}
            </div>
          )}
        </section>

        {/* Testimonial */}
        <section className="mt-8 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <img src={couple} alt="" className="h-14 w-14 rounded-full object-cover" />
            <div>
              <p className="font-serif font-bold">Camille R.</p>
              <p className="text-sm" style={{ color: BRAND }}>★★★★★</p>
            </div>
          </div>
          <Quote className="mt-4 h-5 w-5" style={{ color: BRAND }} />
          <p className="mt-2 text-[15px] italic leading-relaxed text-neutral-700">
            J'ai contribué pour aider Madame Anne à garder son consultoire en ligne. Ce
            geste a tout changé : son portrait m'a guidée vers l'homme de ma vie en
            quelques semaines. Aujourd'hui, nous préparons notre mariage.
          </p>
        </section>

        <footer className="mt-12 border-t border-neutral-200 pt-8 text-center">
          <p className="mx-auto mt-4 max-w-md text-[13px] leading-relaxed text-neutral-600">
            En contribuant, vous acceptez les{" "}
            <a className="underline" href="#">conditions d'utilisation</a> et la{" "}
            <a className="underline" href="#">politique de confidentialité</a>.
          </p>
          <p className="mt-4 text-[13px]" style={{ color: BRAND }}>
            ✨ Des questions ? contact@madameanne.com
          </p>
        </footer>
      </div>
    </main>
  );
}
