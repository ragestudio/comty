module.exports = function (api) {
	api.cache(true)
	return {
		presets: [["babel-preset-expo", { decorators: false }]],
		plugins: [
			[
				"@babel/plugin-transform-typescript",
				{
					isTSX: true,
					allExtensions: true,
					allowDeclareFields: true,
					allowNamespaces: true,
				},
			],
			["@babel/plugin-proposal-decorators", { version: "2023-11" }],
		],
	}
}
