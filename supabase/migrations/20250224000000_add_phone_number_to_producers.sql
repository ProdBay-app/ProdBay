-- ============================================
-- Add phone_number to Producers Table
-- ============================================
-- Enables business branding in quote request emails.
-- RLS: Existing "Users can update their own producer profile" policy
-- already allows UPDATE on all columns (including company_name, phone_number).
--
-- Migration: 20250224000000_add_phone_number_to_producers.sql
-- ============================================

ALTER TABLE public.producers
ADD COLUMN IF NOT EXISTS phone_number text;

COMMENT ON COLUMN public.producers.phone_number IS 'Business phone number for quote request email signatures.';
