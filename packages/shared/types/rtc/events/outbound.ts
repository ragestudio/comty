export interface RTCOutboundEvents {
	"voice:started": { channel_id: string; group_id: string }
	"voice:end": { channel_id: string; group_id: string }
	"voice:left": { user_id: string; channel_id: string }
	"voice:producer_open": {
		user_id: string
		channel_id: string
		producer_id: string
		kind: string
	}
	"voice:producer_close": {
		user_id: string
		channel_id: string
		producer_id: string
		kind: string
	}
}
