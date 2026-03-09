/* Update shop_items for the Stock Market */
ALTER TABLE public.shop_items ADD COLUMN IF NOT EXISTS base_price NUMERIC;
ALTER TABLE public.shop_items ADD COLUMN IF NOT EXISTS current_price NUMERIC;
ALTER TABLE public.shop_items ADD COLUMN IF NOT EXISTS last_price_change TIMESTAMP WITH TIME ZONE DEFAULT NOW();

/* Initialize prices if they are null */
UPDATE public.shop_items SET base_price = token_cost, current_price = token_cost WHERE base_price IS NULL;

/* Function to adjust prices based on demand */
DROP FUNCTION IF EXISTS public.update_boom_market();
CREATE OR REPLACE FUNCTION update_boom_market()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_item RECORD;
    v_avg_sales NUMERIC;
    v_item_sales INTEGER;
    v_price_change_pct NUMERIC;
BEGIN
    -- 1. Calculate average sales per item in the last 7 days
    SELECT AVG(count) INTO v_avg_sales FROM (
        SELECT COUNT(*) as count 
        FROM public.user_activity 
        WHERE activity_type = 'shop_purchase' 
        AND created_at > NOW() - INTERVAL '7 days'
        GROUP BY (details->>'boom')
    ) sub;

    IF v_avg_sales IS NULL THEN v_avg_sales := 1; END IF;

    -- 2. Loop through each shop item and adjust price
    FOR v_item IN SELECT * FROM public.shop_items WHERE is_active = TRUE LOOP
        -- Get sales for this specific item
        SELECT COUNT(*) INTO v_item_sales 
        FROM public.user_activity 
        WHERE activity_type = 'shop_purchase' 
        AND (details->>'boom') = v_item.boom_name
        AND created_at > NOW() - INTERVAL '7 days';

        -- Logic:
        -- > Avg: Price goes up 10%
        -- < Avg: Price goes down 5%
        IF v_item_sales > v_avg_sales THEN
            v_price_change_pct := 1.10;
        ELSIF v_item_sales < v_avg_sales THEN
            v_price_change_pct := 0.95;
        ELSE
            v_price_change_pct := 1.0;
        END IF;

        -- Apply new price with caps (50% to 500% of base)
        UPDATE public.shop_items 
        SET current_price = LEAST(v_item.base_price * 5, GREATEST(v_item.base_price * 0.5, current_price * v_price_change_pct)),
            token_cost = LEAST(v_item.base_price * 5, GREATEST(v_item.base_price * 0.5, current_price * v_price_change_pct)), -- Sync token_cost for existing UI
            last_price_change = NOW()
        WHERE id = v_item.id;
    END LOOP;
END;
$$;
