import { useEffect, useRef } from 'react';
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js';
import { getStripe, getStripeEnvironment } from '@/lib/stripe';
import {
  createDonationCheckout,
  createCustomDonationCheckout,
  checkCheckoutFailure,
} from '@/lib/payments.functions';

type Props = {
  mode: 'fixed' | 'custom';
  priceId?: string;
  amountInCents?: number;
  customerEmail?: string;
  customerName?: string;
  returnUrl: string;
  /** Called once when Stripe reports a payment failure for this session. */
  onFailed?: (reason: string) => void;
};

export function StripeDonationCheckout(props: Props) {
  const sessionIdRef = useRef<string | null>(null);
  const handledRef = useRef(false);

  const fetchClientSecret = async (): Promise<string> => {
    const env = getStripeEnvironment();
    let cs: string;
    if (props.mode === 'fixed' && props.priceId) {
      cs = await createDonationCheckout({
        data: {
          priceId: props.priceId,
          customerEmail: props.customerEmail,
          customerName: props.customerName,
          returnUrl: props.returnUrl,
          environment: env,
        },
      });
    } else if (props.mode === 'custom' && props.amountInCents) {
      cs = await createCustomDonationCheckout({
        data: {
          amountInCents: props.amountInCents,
          customerEmail: props.customerEmail,
          customerName: props.customerName,
          returnUrl: props.returnUrl,
          environment: env,
        },
      });
    } else {
      throw new Error('Invalid checkout configuration');
    }
    // client_secret format: "cs_test_xxx_secret_yyy" — session id is the prefix.
    sessionIdRef.current = cs.split('_secret_')[0];
    return cs;
  };

  // Poll for payment failure so we can silently downgrade.
  useEffect(() => {
    if (!props.onFailed) return;
    handledRef.current = false;

    const env = getStripeEnvironment();
    const interval = setInterval(async () => {
      const sid = sessionIdRef.current;
      if (!sid || handledRef.current) return;
      try {
        const result = await checkCheckoutFailure({
          data: { sessionId: sid, environment: env },
        });
        if (result.status === 'failed') {
          handledRef.current = true;
          props.onFailed?.(result.reason);
        }
      } catch {
        // Network blips are non-fatal — try again next tick.
      }
    }, 2500);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div id="checkout">
      <EmbeddedCheckoutProvider stripe={getStripe()} options={{ fetchClientSecret }}>
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
}
