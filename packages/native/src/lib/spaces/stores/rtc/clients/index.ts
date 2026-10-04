import { RTC } from ".."
import Client from "./client"

export class Clients extends Map<string, Client> {
	constructor(core: RTC, data?: Iterable<readonly [string, Client]>) {
		super(data)
		this.core = core
	}

	core: RTC

	async join(data: {}): Promise<Client | null> {
		return null
	}

	async leave(): Promise<void> {
		return
	}

	async destroyAll(): Promise<void> {
		return
	}
}

export default Clients
