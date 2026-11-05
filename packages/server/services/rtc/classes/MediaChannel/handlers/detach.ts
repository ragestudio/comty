import type { MediaChannel } from ".."

import closeHandler from "./close"

/**
 * Drops the local instance without touching the shared session. Used when the
 * controller lost the ownership claim or when the sfu session must be rebuilt:
 * the router and the persisted state belong to the current owner.
 */
export default async function (this: MediaChannel) {
	return await closeHandler.call(this, { shared: false })
}
