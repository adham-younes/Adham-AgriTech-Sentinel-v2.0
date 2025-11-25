-- Fix fields and farms relationship ambiguity
-- This script resolves the "more than one relationship found for 'fields' and 'farms'" error

BEGIN;

-- Check current state of fields table
DO $$
DECLARE
    farm_id_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'fields' 
        AND column_name = 'farm_id'
        AND table_schema = 'public'
    ) INTO farm_id_exists;
    
    IF farm_id_exists THEN
        RAISE NOTICE 'farm_id column already exists in fields table';
    ELSE
        -- Add farm_id column to fields table if it doesn't exist
        ALTER TABLE public.fields ADD COLUMN farm_id uuid;
        RAISE NOTICE 'Added farm_id column to fields table';
    END IF;
END $$;

-- Create foreign key constraint if it doesn't exist
DO $$
DECLARE
    constraint_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
            ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name = 'fields'
        AND tc.constraint_type = 'FOREIGN KEY'
        AND kcu.column_name = 'farm_id'
        AND tc.table_schema = 'public'
    ) INTO constraint_exists;
    
    IF NOT constraint_exists THEN
        -- Add foreign key constraint
        ALTER TABLE public.fields 
        ADD CONSTRAINT fields_farm_id_fkey 
        FOREIGN KEY (farm_id) REFERENCES public.farms(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added foreign key constraint from fields.farm_id to farms.id';
    ELSE
        RAISE NOTICE 'Foreign key constraint already exists';
    END IF;
END $$;

-- Update existing fields to have farm_id based on their user relationship
UPDATE public.fields 
SET farm_id = (
    SELECT f.id 
    FROM public.farms f 
    WHERE f.user_id = fields.user_id 
    OR f.owner_id = fields.user_id
    LIMIT 1
)
WHERE farm_id IS NULL 
AND user_id IS NOT NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_fields_farm_id ON public.fields(farm_id);

-- Update RLS policies to use the explicit relationship
DROP POLICY IF EXISTS "Users can view their own fields" ON public.fields;
CREATE POLICY "Users can view their own fields" ON public.fields
    FOR SELECT USING (
        auth.uid() = user_id
        OR EXISTS (
            SELECT 1 FROM public.farm_owners fo
            WHERE fo.farm_id = fields.farm_id
            AND fo.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert their own fields" ON public.fields;
CREATE POLICY "Users can insert their own fields" ON public.fields
    FOR INSERT WITH CHECK (
        auth.uid() = user_id
        OR EXISTS (
            SELECT 1 FROM public.farm_owners fo
            WHERE fo.farm_id = farm_id
            AND fo.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update their own fields" ON public.fields;
CREATE POLICY "Users can update their own fields" ON public.fields
    FOR UPDATE USING (
        auth.uid() = user_id
        OR EXISTS (
            SELECT 1 FROM public.farm_owners fo
            WHERE fo.farm_id = fields.farm_id
            AND fo.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can delete their own fields" ON public.fields;
CREATE POLICY "Users can delete their own fields" ON public.fields
    FOR DELETE USING (
        auth.uid() = user_id
        OR EXISTS (
            SELECT 1 FROM public.farm_owners fo
            WHERE fo.farm_id = fields.farm_id
            AND fo.user_id = auth.uid()
        )
    );

COMMIT;

-- Verification query
SELECT 
    'fields_farm_relationship_fixed' as status,
    COUNT(*) as fields_count,
    COUNT(farm_id) as fields_with_farm_id,
    COUNT(CASE WHEN farm_id IS NOT NULL THEN 1 END) as fields_linked_to_farm
FROM public.fields;
