// File: packages/lib/src/validation/nigerian-phone.ts
// Purpose: Single source for Nigerian mobile number validation. Used by
//          apps/web's sign-up schema AND profile-edit schema — extracted
//          here after Phase 2 was about to duplicate it a second time.

// Optional +234/234 prefix or leading 0, followed by a valid network
// prefix and 9 digits.
export const NIGERIAN_PHONE_REGEX = /^(?:\+234|234|0)[789]\d{9}$/;
