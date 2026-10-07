export class IndexedArray<T> extends Array<T> {
	insert(item: T) {
		return this.push(item) - 1
	}

	delete(item: T) {
		const index = this.indexOf(item)

		if (index !== -1) {
			this.splice(index, 1)
		}

		return index
	}

	clear() {
		this.splice(0, this.length)
	}
}

export default IndexedArray
