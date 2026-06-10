/**
 * Stripe webhook handler — also fires RedTrack server-side postbacks.
 *
 * Webhook URL (configured automatically by Lovable Cloud):
 *   https://<your-domain>/api/public/payments/webhook?env=live
 *   https://<your-domain>/api/public/payments/webhook?env=sandbox
 *
 * Stripe Dashboard — required events on the endpoint:
 *   - checkout.session.completed
 *   - checkout.session.async_payment_failed
 *   - payment_intent.succeeded     (RedTrack Purchase postback)
 *   - charge.refunded              (RedTrack Refund postback)
 *
 * Signature verification uses PAYMENTS_SANDBOX_WEBHOOK_SECRET /
 * PAYMENTS_LIVE_WEBHOOK_SECRET (already configured by Lovable Cloud's
 * built-in Stripe payments integration — no STRIPE_WEBHOOK_SECRET to add).
 */
import { createFileRoute } from '@tanstack/react-router';
import { createClient } from '@supabase/supabase-js';
import {
  type StripeEnv,
  createStripeClient,
  verifyWebhook,
} from '@/lib/stripe.server';

const REDTRACK_POSTBACK_URL = 'https://rtk.flamelyapp.com/postback';

let _supabase: any = null;
function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
  }
  return _supabase;
}

async function handleCheckoutCompleted(session: any, env: StripeEnv) {
  if (session.mode !== 'payment') return;
  await getSupabase().from('donations').upsert(
    {
      stripe_session_id: session.id,
      stripe_payment_intent_id: session.payment_intent ?? null,
      amount_cents: session.amount_total ?? 0,
      currency: session.currency ?? 'eur',
      donor_email: session.customer_details?.email ?? session.customer_email ?? null,
      donor_name: session.metadata?.donor_name ?? session.customer_details?.name ?? null,
      status: 'completed',
      environment: env,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'stripe_session_id' },
  );
}

async function handlePaymentFailed(session: any, env: StripeEnv) {
  if (session.id) {
    await getSupabase()
      .from('donations')
      .upsert(
        {
          stripe_session_id: session.id,
          amount_cents: session.amount_total ?? 0,
          currency: session.currency ?? 'eur',
          status: 'failed',
          environment: env,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'stripe_session_id' },
      );
  }
}

function setIf(params: URLSearchParams, key: string, value: unknown) {
  if (value === undefined || value === null || value === '') return;
  params.set(key, String(value));
}

async function fireRedTrackPostback(params: URLSearchParams) {
  const url = `${REDTRACK_POSTBACK_URL}?${params.toString()}`;
  try {
    const res = await fetch(url, { method: 'GET' });
    console.log(`[RedTrack] postback ${res.status} → ${url}`);
  } catch (err) {
    // Never fail the webhook because of a postback hiccup.
    console.error('[RedTrack] postback failed:', err, 'url:', url);
  }
}

async function handlePaymentIntentSucceeded(intent: any, env: StripeEnv) {
  const clickid = intent.metadata?.rt_clickid;
  if (!clickid) {
    console.warn(`[RedTrack] no rt_clickid on PI ${intent.id} — skipping postback`);
    return;
  }

  // Pull billing details from the latest charge.
  let billing: any = null;
  if (intent.latest_charge) {
    try {
      const stripe = createStripeClient(env);
      const charge = await stripe.charges.retrieve(intent.latest_charge as string);
      billing = charge.billing_details ?? null;
    } catch (err) {
      console.error('[RedTrack] failed to fetch charge billing_details:', err);
    }
  }

  const fullName: string = billing?.name ?? '';
  const [firstname, ...rest] = fullName.trim().split(/\s+/);
  const lastname = rest.join(' ');

  const params = new URLSearchParams();
  setIf(params, 'clickid', clickid);
  setIf(params, 'sum', (intent.amount / 100).toFixed(2));
  setIf(params, 'txid', intent.id);
  setIf(params, 'currency', String(intent.currency ?? 'eur').toUpperCase());
  setIf(params, 'type', intent.metadata?.rt_event_type || 'Purchase');
  setIf(
    params,
    'email',
    intent.metadata?.customer_email || intent.receipt_email || billing?.email,
  );
  setIf(params, 'firstname', firstname);
  setIf(params, 'lastname', lastname);
  setIf(params, 'phone', billing?.phone);
  setIf(params, 'country', billing?.address?.country);
  setIf(params, 'city', billing?.address?.city);
  setIf(params, 'zip', billing?.address?.postal_code);

  await fireRedTrackPostback(params);
}

async function handleChargeRefunded(charge: any, env: StripeEnv) {
  const piId = typeof charge.payment_intent === 'string'
    ? charge.payment_intent
    : charge.payment_intent?.id;
  if (!piId) {
    console.warn('[RedTrack] refund without payment_intent — skipping');
    return;
  }

  let intent: any = null;
  try {
    const stripe = createStripeClient(env);
    intent = await stripe.paymentIntents.retrieve(piId);
  } catch (err) {
    console.error('[RedTrack] failed to fetch PI for refund:', err);
    return;
  }

  const clickid = intent?.metadata?.rt_clickid;
  if (!clickid) {
    console.warn(`[RedTrack] no rt_clickid on refunded PI ${piId} — skipping`);
    return;
  }

  const refundedCents: number =
    charge.amount_refunded ?? charge.amount ?? intent.amount ?? 0;

  const params = new URLSearchParams();
  setIf(params, 'clickid', clickid);
  setIf(params, 'sum', (refundedCents / 100).toFixed(2));
  setIf(params, 'txid', intent.id);
  setIf(params, 'currency', String(intent.currency ?? 'eur').toUpperCase());
  setIf(params, 'type', 'Refund');
  setIf(params, 'original_type', intent.metadata?.rt_event_type || 'Purchase');
  setIf(
    params,
    'email',
    intent.metadata?.customer_email || intent.receipt_email || charge.billing_details?.email,
  );

  await fireRedTrackPostback(params);
}

async function handleWebhook(req: Request, env: StripeEnv) {
  const event = await verifyWebhook(req, env);
  switch (event.type) {
    case 'checkout.session.completed':
    case 'transaction.completed':
      await handleCheckoutCompleted(event.data.object, env);
      break;
    case 'checkout.session.async_payment_failed':
    case 'transaction.payment_failed':
      await handlePaymentFailed(event.data.object, env);
      break;
    case 'payment_intent.succeeded':
      await handlePaymentIntentSucceeded(event.data.object, env);
      break;
    case 'charge.refunded':
      await handleChargeRefunded(event.data.object, env);
      break;
    default:
      console.log('Unhandled event:', event.type);
  }
}

export const Route = createFileRoute('/api/public/payments/webhook')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const rawEnv = new URL(request.url).searchParams.get('env');
        if (rawEnv !== 'sandbox' && rawEnv !== 'live') {
          console.error('Invalid env query param:', rawEnv);
          return Response.json({ received: true, ignored: 'invalid env' });
        }
        try {
          await handleWebhook(request, rawEnv);
          return Response.json({ received: true });
        } catch (e) {
          console.error('Webhook error:', e);
          return new Response('Webhook error', { status: 400 });
        }
      },
    },
  },
});
