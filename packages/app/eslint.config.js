import js from "@eslint/js"
import ts from "@typescript-eslint/eslint-plugin"
import globals from "globals"
import pluginReact from "eslint-plugin-react"
import { defineConfig } from "eslint/config"

export default defineConfig([
	{
		files: ["**/*.{js,mjs,cjs,jsx}"],
		plugins: { js },
		extends: ["js/recommended"],
	},
	{
		files: ["**/*.{js,mjs,cjs,jsx}"],
		languageOptions: {
			globals: {
				...globals.browser,
				app: "writable",
			},
		},
	},
	{
		files: ["**/*.{ts,tsx}"],
		plugins: { ts },
		extends: ["plugin:@typescript-eslint/recommended"],
	},
	pluginReact.configs.flat.recommended,
	{
		rules: {
			"react/jsx-uses-react": "off",
			"react/react-in-jsx-scope": "off",
		},
	},
])
