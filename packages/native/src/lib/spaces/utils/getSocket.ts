import { rtcService } from "../stores/rtc"

export default function () {
	return (
		rtcService.socket ??
		globalThis.__comty_shared_state?.ws?.sockets?.get("main") ??
		globalThis.app?.cores?.api?.socket?.() ??
		null
	)
}
