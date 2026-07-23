// Fork of https://github.com/rakheyl/snowflake-uuid

type Snowflake = bigint | number

interface WorkerOptions {
	epoch?: Snowflake
	workerIdBits?: number
	datacenterIdBits?: number
	sequence?: Snowflake
	sequenceBits?: number
}

export class Worker {
	#epoch: bigint
	#workerId: bigint
	#workerIdBits: bigint
	#maxWorkerId: bigint
	#datacenterId: bigint
	#datacenterIdBits: bigint
	#maxDatacenterId: bigint
	#sequence: bigint
	#sequenceBits: bigint
	#workerIdShift: bigint
	#datacenterIdShift: bigint
	#timestampLeftShift: bigint
	#sequenceMask: bigint
	#lastTimestamp: bigint = -1n

	constructor(
		workerId: Snowflake = 0n,
		datacenterId: Snowflake = 0n,
		options?: WorkerOptions,
	) {
		this.#epoch = BigInt(options?.epoch ?? 1609459200000)

		// worker
		this.#workerId = BigInt(workerId)
		this.#workerIdBits = BigInt(options?.workerIdBits ?? 5)
		this.#maxWorkerId = -1n ^ (-1n << this.#workerIdBits)
		if (this.#workerId < 0 || this.#workerId > this.#maxWorkerId) {
			throw new Error(
				`With ${this.#workerIdBits} bits, worker id can't be greater than ${this.#maxWorkerId} or less than 0`,
			)
		}

		// datacenter
		this.#datacenterId = BigInt(datacenterId)
		this.#datacenterIdBits = BigInt(options?.datacenterIdBits ?? 5)
		this.#maxDatacenterId = -1n ^ (-1n << this.#datacenterIdBits)
		if (
			this.#datacenterId < 0 ||
			this.#datacenterId > this.#maxDatacenterId
		) {
			throw new Error(
				`With ${this.#datacenterIdBits} bits, datacenter id can't be greater than ${this.#maxDatacenterId} or less than 0`,
			)
		}

		// sequence
		this.#sequence = BigInt(options?.sequence ?? 0)
		this.#sequenceBits = BigInt(options?.sequenceBits ?? 12)
		this.#sequenceMask = -1n ^ (-1n << this.#sequenceBits)

		// shifts
		this.#workerIdShift = this.#sequenceBits
		this.#datacenterIdShift = this.#sequenceBits + this.#workerIdBits
		this.#timestampLeftShift =
			this.#sequenceBits + this.#workerIdBits + this.#datacenterIdBits
	}

	get workerId(): bigint {
		return this.#workerId
	}

	get datacenterId(): bigint {
		return this.#datacenterId
	}

	get currentSequence(): bigint {
		return this.#sequence
	}

	get lastTimestamp(): bigint {
		return this.#lastTimestamp
	}

	nextId(): bigint {
		let timestamp = Worker.now()

		if (timestamp < this.#lastTimestamp) {
			throw new Error(
				`Clock moved backwards. Can't generate new ID for ${this.#lastTimestamp - timestamp} milliseconds.`,
			)
		}

		if (timestamp === this.#lastTimestamp) {
			this.#sequence = (this.#sequence + 1n) & this.#sequenceMask
			if (this.#sequence === 0n) {
				timestamp = this.tilNextMillis(this.#lastTimestamp)
			}
		} else {
			this.#sequence = 0n
		}

		this.#lastTimestamp = timestamp

		return (
			((timestamp - this.#epoch) << this.#timestampLeftShift) |
			(this.#datacenterId << this.#datacenterIdShift) |
			(this.#workerId << this.#workerIdShift) |
			this.#sequence
		)
	}

	private tilNextMillis(lastTimestamp: bigint): bigint {
		let timestamp: bigint

		do {
			timestamp = Worker.now()
		} while (timestamp <= lastTimestamp)

		return timestamp
	}

	static now(): bigint {
		return BigInt(Date.now())
	}
}
