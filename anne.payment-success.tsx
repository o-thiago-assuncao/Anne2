import { createFileRoute, Link } from '@tanstack/react-router';
import { CheckCircle2, Heart } from 'lucide-react';

export const Route = createFileRoute('/anne/payment-success')({
  validateSearch: (s: Record<string, unknown>): { session_id?: string } => ({
    session_id: typeof s.session_id === 'string' ? s.session_id : undefined,
  }),
  head: () => ({
    meta: [{ title: 'Merci pour votre don — Madame Anne' }],
  }),
  component: SuccessPage,
});

function SuccessPage() {
  const { session_id } = Route.useSearch();
  return (
    <div className="min-h-dvh bg-gradient-to-b from-[var(--brand-purple)] to-[var(--chat-header-deep)] px-5 py-12 text-white">
      <div className="mx-auto max-w-md text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-white/15 ring-2 ring-white/30">
          <CheckCircle2 className="h-12 w-12 text-[var(--brand-gold)]" />
        </div>
        <h1 className="font-serif text-3xl font-bold">Merci infiniment 💕</h1>
        <p className="mt-3 text-white/80">
          Votre don a bien été reçu. Grâce à vous, des filles comme Léa pourront retrouver
          espoir et sécurité.
        </p>
        {session_id && (
          <p className="mt-2 text-xs text-white/40">Référence&nbsp;: {session_id.slice(-12)}</p>
        )}

        <div className="mt-10 rounded-2xl bg-white/10 p-5 backdrop-blur ring-1 ring-white/20">
          <Heart className="mx-auto h-6 w-6 text-[var(--brand-gold)]" />
          <p className="mt-2 text-sm text-white/90">
            Votre dessin d'âme sœur arrive dans votre boîte mail dans quelques minutes ✨
          </p>
        </div>

        <Link
          to="/anne"
          className="mt-8 inline-block rounded-full bg-[var(--brand-gold)] px-7 py-3 font-semibold text-[var(--chat-header-deep)] shadow-lg transition hover:brightness-105"
        >
          Retour au chat
        </Link>
      </div>
    </div>
  );
}
