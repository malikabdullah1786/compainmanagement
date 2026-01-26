-- Add these RPC functions to Supabase for campaign statistics updates
-- Run this in Supabase SQL Editor

-- Increment sent count
CREATE OR REPLACE FUNCTION increment_campaign_sent(campaign_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE campaigns 
    SET total_sent = total_sent + 1 
    WHERE id = campaign_id;
END;
$$ LANGUAGE plpgsql;

-- Increment delivered count
CREATE OR REPLACE FUNCTION increment_campaign_delivered(campaign_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE campaigns 
    SET total_delivered = total_delivered + 1 
    WHERE id = campaign_id;
END;
$$ LANGUAGE plpgsql;

-- Increment failed count
CREATE OR REPLACE FUNCTION increment_campaign_failed(campaign_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE campaigns 
    SET total_failed = total_failed + 1 
    WHERE id = campaign_id;
END;
$$ LANGUAGE plpgsql;

-- Update campaign cost (add to total)
CREATE OR REPLACE FUNCTION add_campaign_cost(campaign_id UUID, cost_to_add DECIMAL)
RETURNS void AS $$
BEGIN
    UPDATE campaigns 
    SET total_cost = total_cost + cost_to_add 
    WHERE id = campaign_id;
END;
$$ LANGUAGE plpgsql;
