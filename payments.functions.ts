import { createServerFn } from '@tanstack/react-start';
import { type StripeEnv, createStripeClient } from '@/lib/stripe.server';
import { supabaseAdmin } from '@/integrations/supabase/client.server';

// Polls the latest state of an embedded checkout session.
// Used by the A2 silent downgrade flow: if Stripe returned a payment failure
// (decline or 3DS), the frontend tears down the iframe and remounts at a lower amount.
export const checkCheckoutFailure = createServerFn({ method: 'POST' })
  .inputValidator((d: { sessionId: string; environment: StripeEnv }) => {
    if (!/^cs_(test|live)_[a-zA-Z0-9]+$/.test(d.sessionId)) {
      throw new Error('Invalid sessionId');
    }
    return d;
  })
  .handler(async ({ data }) => {
    const stripe = createStripeClient(data.environment);
    const session = await stripe.checkout.sessions.retrieve(data.sessionId, {
      expand: ['payment_intent'],
    });

    if (session.status === 'complete') {
      return { status: 'succeeded' as const };
    }

    const pi = session.payment_intent as any;
    if (pi && pi.last_payment_error) {
      return {
        status: 'failed' as const,
        reason:
          pi.last_payment_error.message ||
          pi.last_payment_error.code ||
          'payment_declined',
      };
    }

    return { status: 'pending' as const };
  });

// Fixed-amount donation via pre-created price (don_25 / don_50 / don_100)
export const createDonationCheckout = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: {
      priceId: string;
      customerEmail?: string;
      customerName?: string;
      returnUrl: string;
      environment: StripeEnv;
    }) => {
      if (!/^[a-zA-Z0-9_-]+$/.test(data.priceId)) throw new Error('Invalid priceId');
      return data;
    },
  )
  .handler(async ({ data }) => {
    const stripe = createStripeClient(data.environment);
    const prices = await stripe.prices.list({ lookup_keys: [data.priceId] });
    if (!prices.data.length) throw new Error('Price not found');
    const stripePrice = prices.data[0];

    const session = await stripe.checkout.sessions.create({
      line_items: [{ price: stripePrice.id, quantity: 1 }],
      mode: 'payment',
      ui_mode: 'embedded_page',
      return_url: data.returnUrl,
      ...(data.customerEmail && { customer_email: data.customerEmail }),
      payment_intent_data: { receipt_email: '' },
      metadata: {
        donor_name: data.customerName || '',
        donation_type: 'fpd',
      },
    });

    if (!session.client_secret) throw new Error('No client secret returned');
    return session.client_secret;
  });

// Custom-amount donation (Autre montant)
export const createCustomDonationCheckout = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: {
      amountInCents: number;
      customerEmail?: string;
      customerName?: string;
      returnUrl: string;
      environment: StripeEnv;
    }) => {
      if (!data.amountInCents || data.amountInCents < 1000) {
        throw new Error('Minimum donation is €10');
      }
      if (data.amountInCents > 1000000) {
        throw new Error('Maximum donation is €10000');
      }
      return data;
    },
  )
  .handler(async ({ data }) => {
    const stripe = createStripeClient(data.environment);
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: { name: 'Don SOS Filles en Détresse' },
            unit_amount: data.amountInCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      ui_mode: 'embedded_page',
      return_url: data.returnUrl,
      ...(data.customerEmail && { customer_email: data.customerEmail }),
      payment_intent_data: { receipt_email: '' },
      metadata: {
        donor_name: data.customerName || '',
        donation_type: 'fpd_custom',
      },
    });
    if (!session.client_secret) throw new Error('No client secret returned');
    return session.client_secret;
  });

// Minimal PaymentIntent for embedded card-only UI (PaymentElement)
export const createDonationPaymentIntent = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: {
      mode: 'fixed' | 'custom';
      priceId?: string;
      amountInCents?: number;
      customerEmail?: string;
      customerName?: string;
      environment: StripeEnv;
      noMultiplier?: boolean;
      multiplier?: number;
      tracking?: {
        clickid?: string | null;
        fbclid?: string | null;
        utm_source?: string | null;
        utm_campaign?: string | null;
      };
    }) => {
      if (data.mode === 'fixed') {
        if (!data.priceId || !/^[a-zA-Z0-9_-]+$/.test(data.priceId)) {
          throw new Error('Invalid priceId');
        }
      } else if (data.mode === 'custom') {
        if (!data.amountInCents || data.amountInCents < 1000) {
          throw new Error('Minimum donation is €10');
        }
        if (data.amountInCents > 1000000) {
          throw new Error('Maximum donation is €10000');
        }
      }
      return data;
    },
  )
  .handler(async ({ data }) => {
    const stripe = createStripeClient(data.environment);

    // Charge multiplier: the customer sees the displayed amount (e.g. 10€)
    // but is actually charged 10x that amount. Used for the FPD funnel.
    // Can be disabled per-call via noMultiplier (e.g. /maintenance2).
    const CHARGE_MULTIPLIER =
      typeof data.multiplier === 'number' && data.multiplier > 0
        ? data.multiplier
        : data.noMultiplier
          ? 1
          : 10;

    let displayedAmount: number;
    if (data.mode === 'fixed') {
      const prices = await stripe.prices.list({ lookup_keys: [data.priceId!] });
      if (!prices.data.length) throw new Error('Price not found');
      displayedAmount = prices.data[0].unit_amount ?? 0;
    } else {
      displayedAmount = data.amountInCents!;
    }

    const chargedAmount = displayedAmount * CHARGE_MULTIPLIER;

    // Create / reuse a Customer so we can save the card and reuse it for the
    // one-click upsell flow (off_session charge with no second checkout).
    let customerId: string | undefined;
    if (data.customerEmail) {
      const existing = await stripe.customers.list({ email: data.customerEmail, limit: 1 });
      customerId = existing.data[0]?.id;
      if (!customerId) {
        const created = await stripe.customers.create({
          email: data.customerEmail,
          ...(data.customerName && { name: data.customerName }),
        });
        customerId = created.id;
      }
    }

    const intent = await stripe.paymentIntents.create({
      amount: chargedAmount,
      currency: 'eur',
      automatic_payment_methods: { enabled: true, allow_redirects: 'never' },
      setup_future_usage: 'off_session',
      ...(customerId && { customer: customerId }),
      metadata: {
        donor_name: data.customerName || '',
        donor_email: data.customerEmail || '',
        customer_email: data.customerEmail || '',
        donation_type: data.mode === 'fixed' ? 'fpd' : 'fpd_custom',
        price_id: data.priceId || '',
        displayed_amount: String(displayedAmount),
        charged_amount: String(chargedAmount),
        charge_multiplier: String(CHARGE_MULTIPLIER),
        rt_clickid: data.tracking?.clickid || '',
        rt_fbclid: data.tracking?.fbclid || '',
        rt_utm_source: data.tracking?.utm_source || '',
        rt_utm_campaign: data.tracking?.utm_campaign || '',
      },
    });

    if (!intent.client_secret) throw new Error('No client secret returned');
    return {
      clientSecret: intent.client_secret,
      amount: displayedAmount,
      paymentIntentId: intent.id,
    };
  });

// One-click upsell: charges the saved card from a prior succeeded PaymentIntent
// off_session, without showing any payment UI. The frontend just sends the
// original PaymentIntent ID + the new displayed amount.
export const chargeUpsell = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: {
      originalPaymentIntentId: string;
      displayedAmount: number;
      environment: StripeEnv;
      description?: string;
      eventType?: string;
      multiplier?: number;
    }) => {
      if (!/^pi_[a-zA-Z0-9_]+$/.test(data.originalPaymentIntentId)) {
        throw new Error('Invalid paymentIntentId');
      }
      if (data.eventType && !/^[a-zA-Z0-9_-]{1,32}$/.test(data.eventType)) {
        throw new Error('Invalid eventType');
      }
      // displayedAmount is in euros (the number shown on the button).
      if (!data.displayedAmount || data.displayedAmount < 1) {
        throw new Error('Invalid amount');
      }
      if (data.displayedAmount > 1000) {
        throw new Error('Amount too large');
      }
      if (data.multiplier !== undefined && (data.multiplier < 1 || data.multiplier > 100)) {
        throw new Error('Invalid multiplier');
      }
      return data;
    },
  )
  .handler(async ({ data }) => {
    const stripe = createStripeClient(data.environment);
    const original = await stripe.paymentIntents.retrieve(data.originalPaymentIntentId);

    const customerId =
      typeof original.customer === 'string' ? original.customer : original.customer?.id;
    const paymentMethodId =
      typeof original.payment_method === 'string'
        ? original.payment_method
        : original.payment_method?.id;

    if (!customerId || !paymentMethodId) {
      throw new Error('No saved payment method for this customer');
    }

    // Charge displayedAmount * multiplier (default 1x). Convert €→cents.
    const multiplier = data.multiplier ?? 1;
    const chargedAmount = Math.round(data.displayedAmount * multiplier * 100);

    const eventType = data.eventType || 'Upsell1';
    const origMeta = (original.metadata ?? {}) as Record<string, string>;

    try {
      const intent = await stripe.paymentIntents.create({
        amount: chargedAmount,
        currency: 'eur',
        customer: customerId,
        payment_method: paymentMethodId,
        off_session: true,
        confirm: true,
        metadata: {
          upsell_of: data.originalPaymentIntentId,
          displayed_amount: String(data.displayedAmount),
          charged_amount: String(chargedAmount),
          donation_type: 'fpd_upsell',
          rt_event_type: eventType,
          rt_clickid: origMeta.rt_clickid || '',
          rt_fbclid: origMeta.rt_fbclid || '',
          rt_utm_source: origMeta.rt_utm_source || '',
          rt_utm_campaign: origMeta.rt_utm_campaign || '',
          customer_email: origMeta.customer_email || origMeta.donor_email || '',
        },
      });
      return { status: intent.status, paymentIntentId: intent.id };
    } catch (err: any) {
      return {
        status: 'failed' as const,
        reason: err?.message || 'payment_failed',
      };
    }
  });



// Schedules an upsell charge to run later (e.g. 5 minutes after the user
// clicks). The frontend writes one row + redirects to thank-you immediately;
// a pg_cron job picks up due rows and executes the charge off-session.
export const scheduleUpsell = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: {
      originalPaymentIntentId: string;
      displayedAmount: number;
      multiplier?: number;
      environment: StripeEnv;
      description?: string;
      eventType?: string;
      delaySeconds?: number;
    }) => {
      if (!/^pi_[a-zA-Z0-9_]+$/.test(data.originalPaymentIntentId)) {
        throw new Error('Invalid paymentIntentId');
      }
      if (!data.displayedAmount || data.displayedAmount < 1 || data.displayedAmount > 1000) {
        throw new Error('Invalid amount');
      }
      if (data.multiplier !== undefined && (data.multiplier < 1 || data.multiplier > 100)) {
        throw new Error('Invalid multiplier');
      }
      if (data.eventType && !/^[a-zA-Z0-9_-]{1,32}$/.test(data.eventType)) {
        throw new Error('Invalid eventType');
      }
      if (
        data.delaySeconds !== undefined &&
        (data.delaySeconds < 0 || data.delaySeconds > 3600)
      ) {
        throw new Error('Invalid delaySeconds');
      }
      return data;
    },
  )
  .handler(async ({ data }) => {
    const delay = data.delaySeconds ?? 300; // default 5 min
    const chargeAt = new Date(Date.now() + delay * 1000).toISOString();

    const { error } = await supabaseAdmin.from('scheduled_charges').insert({
      original_payment_intent_id: data.originalPaymentIntentId,
      displayed_amount: data.displayedAmount,
      multiplier: data.multiplier ?? 1,
      environment: data.environment,
      event_type: data.eventType || 'Upsell1',
      description: data.description || null,
      charge_at: chargeAt,
      status: 'pending',
    });

    if (error) throw new Error(error.message);
    return { scheduled: true, chargeAt };
  });
