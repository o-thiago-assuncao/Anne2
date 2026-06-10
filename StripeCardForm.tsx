import { useEffect, useState } from 'react';
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js';
import { motion } from 'framer-motion';
import { getStripe, getStripeEnvironment } from '@/lib/stripe';
import { createDonationPaymentIntent } from '@/lib/payments.functions';
import { getTrackingData } from '@/utils/tracking';

const BRAND = '#8d1759';

type Props = {
  mode: 'fixed' | 'custom';
  priceId?: string;
  amountInCents?: number;
  customerEmail?: string;
  customerName?: string;
  amountLabel: number;
  noMultiplier?: boolean;
  multiplier?: number;
  onSuccess: (paymentIntentId: string) => void;
  onFailed?: (reason: string) => void;
};

function CardForm({
  amountLabel,
  onSuccess,
  onFailed,
}: {
  amountLabel: number;
  onSuccess: (paymentIntentId: string) => void;
  onFailed?: (reason: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements || submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      const { error: submitError } = await elements.submit();
      if (submitError) {
        const msg = submitError.message ?? 'Erreur de validation';
        console.error('[stripe] elements.submit error', submitError);
        setError(msg);
        setSubmitting(false);
        return;
      }

      const returnUrl =
        typeof window !== 'undefined'
          ? `${window.location.origin}/anne/payment-success`
          : '/anne/payment-success';

      const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
        confirmParams: {
          return_url: returnUrl,
          payment_method_data: {
            billing_details: {
              address: {
                country: 'FR',
                postal_code: '75001',
                state: '',
                city: '',
                line1: '',
                line2: '',
              },
            },
          },
        },
      });

      if (confirmError) {
        const msg = confirmError.message ?? 'Paiement refusé';
        console.error('[stripe] confirmPayment error', confirmError);
        setError(msg);
        setSubmitting(false);
        onFailed?.(msg);
        return;
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        onSuccess(paymentIntent.id);
        return;
      }

      // Unexpected non-error, non-success state — surface it instead of hanging.
      const msg = `État inattendu: ${paymentIntent?.status ?? 'inconnu'}`;
      console.error('[stripe] unexpected confirm result', paymentIntent);
      setError(msg);
      setSubmitting(false);
      onFailed?.(msg);
    } catch (err: any) {
      const msg = err?.message ?? 'Erreur inattendue';
      console.error('[stripe] confirmPayment threw', err);
      setError(msg);
      setSubmitting(false);
      onFailed?.(msg);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement
        options={{
          layout: 'tabs',
          fields: { billingDetails: { address: 'never' } },
          wallets: { applePay: 'never', googlePay: 'never' },
        }}
      />

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <motion.button
        type="submit"
        disabled={!stripe || submitting}
        whileTap={{ scale: 0.98 }}
        className="flex w-full items-center justify-center gap-2 rounded-xl py-4 font-serif text-lg font-bold text-white shadow-md transition disabled:opacity-60"
        style={{ background: BRAND }}
      >
        {submitting ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            Traitement…
          </>
        ) : (
          <>🔒 DONNER {amountLabel}€</>
        )}
      </motion.button>
      <p className="text-center text-xs text-neutral-600">
        Accès immédiat au dessin dès réception du don
      </p>
    </form>
  );
}

export function StripeCardForm(props: Props) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setClientSecret(null);
    setError(null);
    createDonationPaymentIntent({
      data: {
        mode: props.mode,
        priceId: props.priceId,
        amountInCents: props.amountInCents,
        customerEmail: props.customerEmail,
        customerName: props.customerName,
        environment: getStripeEnvironment(),
        noMultiplier: props.noMultiplier,
        multiplier: props.multiplier,
        tracking: getTrackingData(),
      },
    })
      .then((res) => {
        if (!cancelled) setClientSecret(res.clientSecret);
      })
      .catch((e) => {
        if (!cancelled) setError(e?.message ?? 'Erreur de chargement');
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.mode, props.priceId, props.amountInCents]);

  if (error) {
    return (
      <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
    );
  }

  if (!clientSecret) {
    return (
      <div className="flex items-center justify-center py-10">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-t-transparent" style={{ borderColor: BRAND, borderTopColor: 'transparent' }} />
      </div>
    );
  }

  return (
    <Elements
      stripe={getStripe()}
      options={{
        clientSecret,
        appearance: {
          theme: 'stripe',
          variables: {
            colorPrimary: BRAND,
            colorText: '#1c1917',
            colorDanger: '#b91c1c',
            fontFamily: 'system-ui, sans-serif',
            borderRadius: '10px',
            fontSizeBase: '15px',
          },
          rules: {
            '.Input': {
              border: '1px solid #d4d4d4',
              padding: '12px 14px',
              boxShadow: 'none',
            },
            '.Input:focus': {
              border: `1px solid ${BRAND}`,
              boxShadow: `0 0 0 2px ${BRAND}22`,
            },
            '.Label': {
              fontWeight: '500',
              fontSize: '13px',
              color: '#525252',
            },
          },
        },
      }}
    >
      <CardForm
        amountLabel={props.amountLabel}
        onSuccess={props.onSuccess}
        onFailed={props.onFailed}
      />
    </Elements>
  );
}
