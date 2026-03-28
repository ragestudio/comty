export default (map) => {
	return Object.entries(map).reduce((obj, [modelName, modelValue]) => {
		return {
			...obj,
			[modelName]: {
				tables: [modelValue.table_name],
			},
		}
	}, {})
}
