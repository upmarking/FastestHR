

# Billing System Enhancement Plan

## Summary
Add gift card redemption, discount codes on wallet recharge, auto-debit subscription renewal, low-balance warnings, animations, and security hardening to the billing system.

## 1. Database Migration — New Tables

**`gift_cards` table:**
- `id`, `company_id` (nullable, null = global), `code` (unique), `amount`, `is_redeemed`, `redeemed_by`, `redeemed_at`, `expires_at`, `created_by`, `created_at`
- RLS: super_admin can manage; authenticated users can SELECT for validation only

**`discount_codes` table:**
- `id`, `code` (unique), `type` (percentage/flat), `value`, `min_amount`, `max_uses`, `used_count`, `expires_at`, `is_active`, `created_by`, `created_at`
- RLS: super_admin can manage; authenticated can SELECT active codes for validation

**Migration also updates `wallet_transactions`:**
- Add `discount_code` and `discount_amount` columns to track applied discounts
- Add `gift_card_id` column for gift card redemption tracking

## 2. Edge Function Updates (`razorpay-order/index.ts`)

Add three new actions:

- **`redeem_gift_card`**: Validate code (not redeemed, not expired), credit wallet, mark as redeemed, log transaction
- **`validate_discount`**: Check code validity (active, not expired, usage limit, min amount), return discount amount
- **`create_order` enhancement**: Accept optional `discount_code`, validate it, apply discount to Razorpay order amount, store discount info in transaction

Security: All wallet mutations happen server-side only. No direct client updates to `wallet_balance` or `license_limit`.

## 3. Billing UI Overhaul (`Billing.tsx`)

**New UI elements:**
- **Gift Card button** on Wallet card — opens dialog with code input, validates and redeems via edge function
- **Discount code section** in Add Credits dialog — collapsible "Have a discount code?" with Apply button, shows discount preview before payment
- **Auto-debit warning banner** — RED if wallet balance < 3 months subscription cost (`licenseLimit × pricePerLicense × 3`), prompting user to top up
- **Low balance indicator** on wallet card — color-coded balance (red/yellow/green based on months of runway)

**Animations (CSS + Tailwind):**
- Fade-in on card mount with staggered delays
- Counter animation on wallet balance (animate number counting up)
- Pulse effect on warning banners
- Scale-in on transaction items
- Smooth dialog transitions

**Security hardening:**
- Remove any direct Supabase `.update()` calls on `companies.wallet_balance` from frontend
- All balance changes go through edge function only
- Display wallet as read-only with a shield icon indicator

## 4. Auto-Debit Logic

The auto-debit concept is shown as a visual indicator only (since we can't run cron jobs from the frontend). The UI will:
- Calculate 3-month runway cost and compare to balance
- Show RED banner: "Your wallet balance is below 3 months of subscription cost (₹X). Top up to avoid service interruption."
- Show YELLOW if below 6 months runway
- The extend subscription dialog already debits from wallet server-side

## Technical Details

**Files to create:**
- `supabase/migrations/xxx_gift_cards_discount_codes.sql`

**Files to modify:**
- `supabase/functions/razorpay-order/index.ts` — add `redeem_gift_card`, `validate_discount`, enhance `create_order`
- `src/pages/settings/Billing.tsx` — complete rewrite with all new features, animations, security

**Animation approach:** Use Tailwind's `animate-fade-in` with inline `animationDelay` for staggered card entrance. Use `useEffect` with `requestAnimationFrame` for balance counter animation.

