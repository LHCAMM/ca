# Event Architecture

1. **Order Created/Updated (Webhook or Poll):**
   - Normalize payload into `orders`.
   - Emit SSE `orders` event.
   - If unpaid age >15m, enqueue follow-up draft.

2. **Gmail Poller Match:**
   - Pull candidate messages by query.
   - Score against orders using email/order#/amount/processor pattern.
   - High confidence => create `payment_events` + set `payment_confirmed=true`.
   - Low confidence => insert `manual_action_queue` record.

3. **Manual Queue Actions:**
   - Shop Manager confirms/rejects payment match or marks processed/completed.
   - Every action writes `audit_logs` with before/after snapshots.

4. **Revenue Update:**
   - Revenue metric includes only `payment_confirmed=true AND order_marked_processed=true`.

5. **Heartbeat + Alerts:**
   - Each subsystem writes heartbeat.
   - If stale/failing repeatedly, escalation alert is stored and surfaced.
