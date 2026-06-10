import { createFileRoute } from '@tanstack/react-router';
import { supabaseAdmin } from '@/integrations/supabase/client.server';
import { createStripeClient, type StripeEnv } from '@/lib/stripe.server';

// Called every minute by pg_cron. Picks up scheduled_charges rows whose
// charge_at is due and runs them off_session against the saved card from
// the original PaymentIntent. Outcome is recorded on the row.
export const Route = createFileRoute('/api/public/hooks/process-scheduled-charges')({
  server: {
    handlers: {
      POST: async () => {
        // Atomically claim due rows so concurrent runs can't double-charge.
        const nowIso = new Date().toISOString();

        // Claim up to 50 due rows by flipping pending -> processing.
        // The conditional eq('status', 'pending') guards against double-claim
        // if two cron runs overlap.
        const { data: due } = await supabaseAdmin
          .from('scheduled_charges')
          .select('id')
          .eq('status', 'pending')
          .lte('charge_at', nowIso)
          .limit(50);

        let rows: any[] = [];
        if (due && due.length) {
          const ids = due.map((r: any) => r.id);
          const { data: updated } = await supabaseAdmin
            .from('scheduled_charges')
            .update({ status: 'processing', attempts: 1 })
            .in('id', ids)
            .eq('status', 'pending')
            .select('*');
          rows = updated ?? [];
        }

        const results: any[] = [];

        for (const row of rows) {
          try {
            const stripe = createStripeClient(row.environment as StripeEnv);
            const original = await stripe.paymentIntents.retrieve(
              row.original_payment_intent_id,
            );
            const customerId =
              typeof original.customer === 'string'
                ? original.customer
                : original.customer?.id;
            const paymentMethodId =
              typeof original.payment_method === 'string'
                ? original.payment_method
                : original.payment_method?.id;

            if (!customerId || !paymentMethodId) {
              throw new Error('No saved payment method on original intent');
            }

            const chargedAmount = Math.round(
              row.displayed_amount * row.multiplier * 100,
            );
            const origMeta = (original.metadata ?? {}) as Record<string, string>;

            const intent = await stripe.paymentIntents.create({
              amount: chargedAmount,
              currency: 'eur',
              customer: customerId,
              payment_method: paymentMethodId,
              off_session: true,
              confirm: true,
              metadata: {
                upsell_of: row.original_payment_intent_id,
                displayed_amount: String(row.displayed_amount),
                charged_amount: String(chargedAmount),
                donation_type: 'fpd_upsell',
                rt_event_type: row.event_type,
                rt_clickid: origMeta.rt_clickid || '',
                rt_fbclid: origMeta.rt_fbclid || '',
                rt_utm_source: origMeta.rt_utm_source || '',
                rt_utm_campaign: origMeta.rt_utm_campaign || '',
                customer_email:
                  origMeta.customer_email || origMeta.donor_email || '',
                scheduled_charge_id: row.id,
              },
            });

            await supabaseAdmin
              .from('scheduled_charges')
              .update({
                status: intent.status === 'succeeded' ? 'succeeded' : 'failed',
                result_payment_intent_id: intent.id,
                failure_reason:
                  intent.status === 'succeeded' ? null : intent.status,
                processed_at: new Date().toISOString(),
              })
              .eq('id', row.id);

            results.push({ id: row.id, status: intent.status });
          } catch (err: any) {
            await supabaseAdmin
              .from('scheduled_charges')
              .update({
                status: 'failed',
                failure_reason: err?.message || 'unknown_error',
                processed_at: new Date().toISOString(),
              })
              .eq('id', row.id);
            results.push({ id: row.id, status: 'failed', error: err?.message });
          }
        }

        return Response.json({ processed: results.length, results });
      },
    },
  },
});
