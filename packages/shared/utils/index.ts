import { Bind as _Bind } from "./bind"

globalThis.Bind = _Bind

declare global {
	var Bind: typeof _Bind
}

export { _Bind as Bind }
