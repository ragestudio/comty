export class MirrorMap<K, V> {
	constructor(targetMap?: Map<any, any>) {
		this._targetMap = targetMap ?? new Map()
	}

	_targetMap: Map<any, any>

	get _mirrorMap(): Map<K, V> {
		// @ts-ignore
		return this._targetMap
	}

	get size(): number {
		return this._mirrorMap.size
	}

	get(key: K): V | undefined {
		return this._mirrorMap.get(key)
	}

	has(key: K): boolean {
		return this._mirrorMap.has(key)
	}

	values(): IterableIterator<V> {
		return this._mirrorMap.values()
	}

	keys(): IterableIterator<K> {
		return this._mirrorMap.keys()
	}

	entries(): IterableIterator<[K, V]> {
		return this._mirrorMap.entries()
	}

	forEach(
		callback: (value: V, key: K, map: Map<K, V>) => void,
		thisArg?: any,
	): void {
		this._mirrorMap.forEach(callback, thisArg)
	}

	[Symbol.iterator](): IterableIterator<[K, V]> {
		return this._mirrorMap[Symbol.iterator]()
	}
}

export default MirrorMap
