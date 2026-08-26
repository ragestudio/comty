export default function () {
	return (
		globalThis.__comty_shared_state?.ws?.sockets?.get("main") ??
		globalThis.app?.cores?.api?.socket?.() ??
		null
	)
}
