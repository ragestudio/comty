import js from "@eslint/js"
import ts from "@typescript-eslint/eslint-plugin"
import tsParser from "@typescript-eslint/parser"

import globals from "globals"
import { defineConfig } from "eslint/config"

export default defineConfig([
	{
		files: ["**/*.{js,ts,mjs,cjs}"],
		plugins: { js, ts },
		extends: ["js/recommended", "plugin:@typescript-eslint/recommended"],
		languageOptions: {
			parser: tsParser,
			globals: {
				...globals.node,
				OperationError: "readonly",
				Boot: "readonly",
				ToBoolean: "readonly",
				IPC: "readonly",
				nanoid: "readonly",
				process: "writable",
			},
		},
	},
])
