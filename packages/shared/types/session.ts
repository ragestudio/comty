export type DecodedAuthToken = {
	_id?: string
	session_id?: string // an alias of _id
	user_id?: string

	sign_location?: string
	ip_address?: string

	created_at?: Date

	// standard claims https://datatracker.ietf.org/doc/html/rfc7519#section-4.1
	iss?: string | undefined
	sub?: string | undefined
	aud?: string | string[] | undefined
	exp?: number | undefined
	nbf?: number | undefined
	iat?: number | undefined
	jti?: string | undefined

	client_id?: string
	type?: string

	scope?: string
}
