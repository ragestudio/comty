export default class QueueManager {
	constructor(params = {}) {
		this.params = params

		return this
	}

	prevItems = []
	nextItems = []

	currentItem = null

	next = ({ random = false } = {}) => {
		if (this.nextItems.length === 0) {
			return null
		}

		if (this.currentItem) {
			this.prevItems.push(this.currentItem)
		}

		if (random) {
			const randomIndex = Math.floor(
				Math.random() * this.nextItems.length,
			)

			this.currentItem = this.nextItems.splice(randomIndex, 1)[0]
		} else {
			this.currentItem = this.nextItems.shift()
		}

		return this.currentItem
	}

	set = (item) => {
		if (typeof item === "number") {
			item = this.nextItems[item]
		}

		if (this.currentItem && this.currentItem.id === item.id) {
			return this.currentItem
		}

		const itemInNext = this.nextItems.findIndex((i) => i.id === item.id)
		const itemInPrev = this.prevItems.findIndex((i) => i.id === item.id)

		if (itemInNext === -1 && itemInPrev === -1) {
			throw new Error("Item not found in the queue")
		}

		if (itemInNext > -1) {
			if (this.currentItem) {
				this.prevItems.push(this.currentItem)
			}

			this.prevItems.push(...this.nextItems.splice(0, itemInNext))

			this.currentItem = this.nextItems.shift()
		}

		if (itemInPrev > -1) {
			if (this.currentItem) {
				this.nextItems.unshift(this.currentItem)
			}

			this.nextItems.unshift(...this.prevItems.splice(itemInPrev + 1))

			this.currentItem = this.prevItems.pop()
		}

		return this.currentItem
	}

	previous = () => {
		if (this.prevItems.length === 0) {
			return this.currentItem
		}

		if (this.currentItem) {
			this.nextItems.unshift(this.currentItem)
		}

		this.currentItem = this.prevItems.pop()

		return this.currentItem
	}

	add = (items, position = "end") => {
		if (!Array.isArray(items)) {
			items = [items]
		}

		if (position === "start") {
			this.nextItems = [...items, ...this.nextItems]
		} else {
			this.nextItems = [...this.nextItems, ...items]
		}

		return items
	}

	remove = (item) => {
		const indexNext = this.nextItems.findIndex((i) => i.id === item.id)
		const indexPrev = this.prevItems.findIndex((i) => i.id === item.id)

		if (indexNext > -1) {
			this.nextItems.splice(indexNext, 1)
		}

		if (indexPrev > -1) {
			this.prevItems.splice(indexPrev, 1)
		}
	}

	flush = () => {
		this.nextItems = []
		this.prevItems = []
		this.currentItem = null
	}

	async load(item) {
		if (typeof this.params.loadFunction === "function") {
			return await this.params.loadFunction(item)
		}

		return item
	}
}
