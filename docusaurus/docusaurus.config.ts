// @ts-check
// `@type` JSDoc annotations allow editor autocompletion and type checking
// (when paired with `@ts-check`).
// There are various equivalent ways to declare your Docusaurus config.
// See: https://docusaurus.io/docs/api/docusaurus-config

import { themes as prismThemes } from "prism-react-renderer"
import type { Config } from "@docusaurus/types"
import type { ThemeConfig } from "@docusaurus/preset-classic"
const config: Config = {
	title: "Comty Documentation",
	tagline: "The place for developers",
	favicon: "https://comty.app/favicon.ico",

	// Set the production url of your site here
	url: "https://comty.app",
	// Set the /<baseUrl>/ pathname under which your site is served
	// For GitHub pages deployment, it is often "/<projectName>/"
	baseUrl: "/",

	// GitHub pages deployment config.
	// If you aren"t using GitHub pages, you don"t need these.
	organizationName: "ragestudio", // Usually your GitHub org/user name.
	projectName: "comty", // Usually your repo name.

	onBrokenLinks: "throw",
	onBrokenMarkdownLinks: "warn",

	// Even if you don"t use internationalization, you can use this field to set
	// useful metadata like html lang. For example, if your site is Chinese, you
	// may want to replace "en" with "zh-Hans".
	i18n: {
		defaultLocale: "en",
		locales: ["en"],
	},

	presets: [
		[
			"classic",
			{
				docs: {
					path: "../docs/en",
					routeBasePath: "docs",
					sidebarPath: "./sidebars.js",
				},
				theme: {
					customCss: "./src/css/custom.css",
				},
			},
		],
	],

	plugins: [
		[
			"@docusaurus/plugin-content-docs",
			{
				id: "es",
				path: "../docs/es",
				routeBasePath: "es/docs",
				sidebarPath: "./sidebars.js",
			},
		],
		[
			"docusaurus-plugin-openapi-docs",
			{
				id: "api", // plugin id
				docsPluginId: "classic", // configured for preset-classic
				config: {
					petstore: {
						specPath: "examples/petstore.yaml",
						outputDir: "docs/petstore",
						sidebarOptions: {
							groupPathsBy: "tag",
						},
					},
				},
			},
		],
	],

	themeConfig: {
		// Replace with your project"s social card
		image: "img/docusaurus-social-card.jpg",
		navbar: {
			title: "Comty Developers",
			logo: {
				alt: "Comty Logo",
				src: "https://comty.app/basic_alt.svg",
			},
			items: [
				{
					type: "docSidebar",
					sidebarId: "docs",
					position: "left",
					label: "Docs",
				},
				// {
				// 	type: "docSidebar",
				// 	sidebarId: "legal",
				// 	position: "left",
				// 	label: "Legal",
				// },
				{
					href: "https://github.com/ragestudio/comty",
					label: "GitHub",
					position: "right",
				},
				{
					type: "dropdown",
					label: "Language",
					position: "right",
					items: [
						{
							label: "English",
							to: "/docs/development/getting-started",
						},
						{
							label: "Español",
							to: "/es/docs/development/getting-started",
						},
					],
				},
			],
		} as ThemeConfig,
		footer: {
			style: "dark",
			links: [
				{
					title: "Community",
					items: [
						{
							label: "Discord",
							href: "https://discordapp.com/invite/docusaurus",
						},
						{
							label: "GitHub",
							href: "https://github.com/ragestudio/comty",
						},
						{
							label: "Comty",
							href: "https://comty.app/@ragestudio",
						},
					],
				},
			],
			copyright: `Copyright © ${new Date().getFullYear()} RageStudio. Built with Docusaurus.`,
		},
		prism: {
			theme: prismThemes.github,
			darkTheme: prismThemes.dracula,
		},
		colorMode: {
			defaultMode: "dark",
		},
	},
}

export default config
