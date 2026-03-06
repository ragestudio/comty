export default function (set: Set<any>, fn: (item: any) => boolean) {
	for (const item of set) {
		if (fn(item)) {
			return item
		}

		continue
	}
}
