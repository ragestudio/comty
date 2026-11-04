// a profile is considered fresh for this long before a background refresh
export const USERS_FRESH_MS = 5 * 60 * 1000

// negative cache for ids the api did not return, avoids fetching them on
// every render while the user is really gone
export const USERS_MISSING_TTL_MS = 60 * 1000

// hydrated decorations change less often than the rest of the profile
export const USERS_DECORATIONS_FRESH_MS = 10 * 60 * 1000

// requests are grouped in small batches to avoid one request per component
export const USERS_BATCH_SIZE = 50
export const USERS_BATCH_DELAY_MS = 10

// presence is not cached, active views refresh it on this interval
export const USERS_PRESENCE_REFRESH_MS = 30 * 1000
