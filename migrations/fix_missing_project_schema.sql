-- Missing functionality identified during review:
-- The codebase references several properties that are not currently standard in the database, or they were introduced in 'updated_schema_v3_transactions.sql' which needs to be merged.
-- 1. Restaurants table missing twilio subaccount info and budgeting.
-- 2. Transactions table missing entirely from main db schema.
-- 3. Customers table requires 'opt_in_date' & 'opt_out_date' but we only have 'last_visit'.

-- Apply these missing fields to restaurants
ALTER TABLE public.restaurants 
ADD COLUMN IF NOT EXISTS twilio_subaccount_sid TEXT,
ADD COLUMN IF NOT EXISTS twilio_auth_token TEXT,
ADD COLUMN IF NOT EXISTS budget_monthly_gbp DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS budget_daily_gbp DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS current_spend_gbp DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS creation_type TEXT CHECK (creation_type IN ('agency_created', 'self_created')) DEFAULT 'self_created',
ADD COLUMN IF NOT EXISTS created_by_agency_id UUID REFERENCES agencies(id) ON DELETE SET NULL;

-- Customers table missing opt-in dates based on the webhook code
ALTER TABLE public.customers
ADD COLUMN IF NOT EXISTS opt_in_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS opt_out_date TIMESTAMPTZ;

-- Transactions tracking is missing or unlinked to campaigns directly
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL, 
    amount_gbp DECIMAL(10, 4) NOT NULL,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('campaign_send', 'number_purchase', 'subscription_fee', 'budget_allocation')),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index and RLS for transactions
CREATE INDEX IF NOT EXISTS idx_transactions_restaurant ON public.transactions(restaurant_id);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;
CREATE POLICY "Users can view own transactions" ON public.transactions
    FOR SELECT USING (
        restaurant_id = (auth.jwt() -> 'app_metadata' ->> 'restaurant_id')::uuid
        OR
        (auth.jwt() -> 'app_metadata' ->> 'role') IN ('superadmin', 'agency_admin')
    );

-- Trigger for transactions updated_at
DROP TRIGGER IF EXISTS update_transactions_updated_at ON public.transactions;
CREATE TRIGGER update_transactions_updated_at
    BEFORE UPDATE ON public.transactions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
