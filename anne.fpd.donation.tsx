import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Quote } from "lucide-react";
import anneAvatar from "@/assets/anne-avatar.jpg";
import sosLogo from "@/assets/sos-logo.png";
import lea from "@/assets/lea.jpg";
import couple from "@/assets/testimonial-couple.jpg";
import { StripeCardForm } from "@/components/StripeCardForm";
import { useNavigate } from "@tanstack/react-router";


type Search = { name?: string; email?: string };

export const Route = createFileRoute("/anne/fpd/donation")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    name: typeof s.name === "string" ? s.name : undefined,
    email: typeof s.email === "string" ? s.email : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Votre don — Madame Anne & SOS Filles de Dieu" },
      { name: "description", content: "Faites un don symbolique et recevez le portrait de votre âme sœur." },
    ],
  }),
  component: DonationPage,
});

const PRESETS = [10, 25, 50] as const;
const BRAND = "#8d1759";

const equivalence = (amount: number): string => {
  if (amount >= 50) return "🏠 Un mois d'accueil complet";
  if (amount >= 25) return "🍽️ Nourrit un enfant pendant 13 jours";
  if (amount >= 10) return "🍽️ Nourrit un enfant pendant 5 jours";
  return "Une aide précieuse pour un enfant";
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

function DonationPage() {
  const { name: nameParam, email: emailParam } = useSearch({ from: "/anne/fpd/donation" });
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
      if (!data.timestamp || Date.now() - data.timestamp > 60 * 60 * 1000) return;
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

  const returnUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/anne/payment-success?session_id={CHECKOUT_SESSION_ID}`
      : "/anne/payment-success?session_id={CHECKOUT_SESSION_ID}";

  const displayName = nameParam || name || "";

  return (
    <main className="min-h-dvh bg-white text-neutral-900">
      

      {/* Header bar */}
      <header className="border-b border-neutral-200">
        <div className="mx-auto max-w-[680px] px-5 py-4">
          <img src={sosLogo} alt="SOS Filles de Dieu" className="h-10 w-auto" />
        </div>
      </header>

      <div className="mx-auto max-w-[680px] px-5 pt-8 pb-16">
        {/* Partnership */}
        <section className="text-center">
          <div className="flex items-center justify-center gap-3">
            <div className="flex h-20 w-20 items-center justify-center rounded-full border-[3px] bg-white" style={{ borderColor: BRAND }}>
              <img src={sosLogo} alt="SOS Filles de Dieu" className="h-12 w-12 object-contain" />
            </div>
            <span className="text-2xl" style={{ color: BRAND }}>♥</span>
            <img src={anneAvatar} alt="Madame Anne" className="h-20 w-20 rounded-full border-[3px] object-cover" style={{ borderColor: BRAND }} />
          </div>
          <p className="mt-4 font-serif italic text-[15px]" style={{ color: BRAND }}>
            ✨ Partenariat Officiel ✨
          </p>
          <h1 className="mt-5 font-serif text-[28px] font-bold leading-tight text-neutral-900">
            {displayName ? `${displayName}, ` : ""}Votre Geste d'Amour Est Presque Terminé
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-neutral-700">
            Faites votre don aux enfants de SOS Filles de Dieu et recevez immédiatement le portrait de votre âme sœur dessiné par Madame Anne.
          </p>
        </section>

        {/* Léa story */}
        <section className="mt-10 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
          <img src={lea} alt="Léa, accueillie par SOS Filles de Dieu" className="h-72 w-full object-cover" />
          <div className="p-6">
            <h2 className="font-serif text-2xl font-bold">Découvrez Léa</h2>
            <p className="mt-3 text-[15px] leading-relaxed text-neutral-700">
              Léa a perdu ses parents dans un accident de voiture à l'âge de 4 ans. Aujourd'hui, elle vit dans un foyer de{" "}
              <strong>SOS Filles de Dieu</strong>, où elle reçoit nourriture, éducation et tendresse chaque jour.
            </p>
            <p className="mt-4 font-serif italic font-semibold" style={{ color: BRAND }}>
              Votre don de {amount}€ {amount >= 50 ? "offre un mois d'accueil complet à un enfant comme elle." : amount >= 25 ? "nourrit un enfant comme elle pendant 13 jours." : "nourrit un enfant comme elle pendant 5 jours."}
            </p>
            <p className="mt-4 text-[15px] leading-relaxed text-neutral-700">
              {displayName ? `${displayName}, ` : ""}ce geste prouve que votre cœur est pur — <em>Et Dieu récompense les cœurs purs avec le véritable amour.</em>
            </p>
          </div>
        </section>

        {/* Email reminder */}
        {finalEmail && (
          <section className="mt-6 rounded-2xl border border-neutral-200 bg-neutral-50 p-5 text-[14px] text-neutral-700">
            Dès que votre don sera confirmé, vous recevrez le portrait de votre âme sœur à{" "}
            <strong className="text-neutral-900">{finalEmail}</strong>.
          </section>
        )}

        {/* Payment card */}
        <section className="mt-10 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="font-serif text-[22px] font-bold leading-tight">
            {displayName ? `${displayName}, ` : ""}Choisissez le Montant de Votre Don
          </h2>
          <p className="mt-1 text-sm text-neutral-600">100% du montant va directement aux enfants.</p>

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
                      ✨ LE PLUS CHOISI
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
              Renseignez votre prénom et votre email pour faire votre don de {amount}€.
            </p>
          ) : (
            <div>
              <div className="mb-3 flex items-center justify-between text-sm">
                <span className="text-neutral-700">
                  Don de <strong style={{ color: BRAND }}>{currentAttempt?.amount ?? amount}€</strong>
                  {attempts.length > 1 && (
                    <span className="ml-2 text-xs text-neutral-500">(tentative {attempts.length})</span>
                  )}
                </span>
              </div>

              {exhausted ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-center text-sm text-red-800">
                  <p className="font-semibold">Votre carte a été refusée plusieurs fois.</p>
                  <p className="mt-2 text-red-700">Merci d'essayer avec un autre moyen de paiement.</p>
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
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-t-transparent" style={{ borderColor: BRAND, borderTopColor: "transparent" }} />
                  <p className="text-sm text-neutral-700">
                    Le paiement de <strong>{downgrading.from}€</strong> n'a pas été validé.
                    <br />
                    Nous réessayons avec <strong style={{ color: BRAND }}>{downgrading.to}€</strong>…
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
              <p className="font-serif font-bold">Sophie & Marc</p>
              <p className="text-sm" style={{ color: BRAND }}>★★★★★</p>
            </div>
          </div>
          <Quote className="mt-4 h-5 w-5" style={{ color: BRAND }} />
          <p className="mt-2 text-[15px] italic leading-relaxed text-neutral-700">
            J'ai donné 100€ parce que je sais que Dieu récompense les cœurs généreux. Quand j'ai vu le portrait, quelque chose en moi a dit : il existe. 17 jours plus tard, je le regardais dans les yeux. Aujourd'hui, nous fêtons nos 3 mois ensemble.
          </p>
        </section>

        {/* Footer */}
        <footer className="mt-12 border-t border-neutral-200 pt-8 text-center">
          <img src={sosLogo} alt="SOS Filles de Dieu" className="mx-auto h-12 w-auto" />
          <p className="mx-auto mt-4 max-w-md text-[13px] leading-relaxed text-neutral-600">
            Cette page est un partenariat officiel entre Madame Anne et SOS Filles de Dieu. En faisant votre don, vous acceptez les{" "}
            <a className="underline" href="#">conditions d'utilisation</a> et la{" "}
            <a className="underline" href="#">politique de confidentialité</a>.
          </p>
          <p className="mt-4 text-[13px]" style={{ color: BRAND }}>
            ✨ Des questions ? Contactez-nous : contact@madameanne.com
          </p>
        </footer>
      </div>
    </main>
  );
}
