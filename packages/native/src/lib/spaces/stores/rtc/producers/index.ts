import type { RTC } from ".."
import type { Producer } from "./producer"

export class Producers extends Map<string, Producer> {
	constructor(core: RTC, data?: Iterable<readonly [string, Producer]>) {
		super(data)
		this.core = core
	}

	core: RTC

	async produce() {}

	onSelfProducerClosed() {}

	setRemote(producer: Producer): Producer | null {
		return null
	}

	delRemote(producer: Producer): Producer | null {
		return null
	}

	getSelfProducers() {
		return Array.from(this.values()).filter((producer) => producer.self)
	}

	clear(): void {
		super.clear()
	}
}

export default Producers
