-- Enums for Stripe Billing subscription management
DO $$ BEGIN
  CREATE TYPE public.subscription_plan AS ENUM ('basic', 'pro', 'complete');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.billing_cycle AS ENUM ('monthly', 'quarterly', 'semiannual', 'annual');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.subscription_status AS ENUM (
    'active',
    'past_due',
    'canceled',
    'incomplete',
    'incomplete_expired',
    'unpaid'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Subscriptions table: one row per restaurant, written by service role via Stripe webhook
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id                      uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id               uuid        NOT NULL,
  restaurant_id           uuid        NOT NULL,
  stripe_customer_id      text        NOT NULL,
  stripe_subscription_id  text        NOT NULL UNIQUE,
  stripe_price_id         text        NOT NULL,
  plan                    public.subscription_plan   NOT NULL,
  billing_cycle           public.billing_cycle       NOT NULL,
  status                  public.subscription_status NOT NULL,
  current_period_start    timestamptz NOT NULL,
  current_period_end      timestamptz NOT NULL,
  cancel_at_period_end    boolean     NOT NULL DEFAULT false,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT subscriptions_tenant_fk
    FOREIGN KEY (tenant_id)
    REFERENCES public.tenants(id) ON DELETE CASCADE,

  CONSTRAINT subscriptions_restaurant_fk
    FOREIGN KEY (tenant_id, restaurant_id)
    REFERENCES public.restaurants(tenant_id, id) ON DELETE CASCADE,

  CONSTRAINT subscriptions_tenant_restaurant_uk
    UNIQUE (tenant_id, restaurant_id),

  CONSTRAINT subscriptions_tenant_stripe_customer_uk
    UNIQUE (tenant_id, stripe_customer_id)
);

CREATE INDEX IF NOT EXISTS subscriptions_tenant_restaurant_idx
  ON public.subscriptions (tenant_id, restaurant_id);

CREATE INDEX IF NOT EXISTS subscriptions_stripe_subscription_id_idx
  ON public.subscriptions (stripe_subscription_id);

-- Auto-update updated_at via shared trigger function
DROP TRIGGER IF EXISTS subscriptions_set_updated_at ON public.subscriptions;
CREATE TRIGGER subscriptions_set_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_ordering_updated_at();

-- RLS: authenticated restaurant members can read their own subscription.
-- All writes come from service role (Stripe webhook) — no authenticated write policies.
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Restaurant members can read their subscription" ON public.subscriptions;
CREATE POLICY "Restaurant members can read their subscription"
  ON public.subscriptions
  FOR SELECT
  TO authenticated
  USING (
    public.has_restaurant_membership(tenant_id, restaurant_id)
  );
