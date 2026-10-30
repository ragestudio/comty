// @ts-check
import { themes as prismThemes } from "prism-react-renderer"
import type { Config } from "@docusaurus/types"
import type { ThemeConfig } from "@docusaurus/preset-classic"

const config: Config = {
	title: "Comty Documentation",
	tagline: "A place for developers",
	favicon: "https://comty.app/favicon.ico",

	url: "https://docs.comty.app",
	baseUrl: "/",

	organizationName: "ragestudio",
	projectName: "comty",

	onBrokenLinks: "throw",
	onBrokenMarkdownLinks: "warn",

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
					routeBasePath: "/",
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
				routeBasePath: "es",
				sidebarPath: "./sidebars.js",
			},
		],
		[
			"docusaurus-plugin-openapi-docs",
			{
				id: "api",
				docsPluginId: "classic",
				config: {
					petstore: {
						specPath: "examples/petstore.yaml",
						outputDir: "petstore",
						sidebarOptions: {
							groupPathsBy: "tag",
						},
					},
				},
			},
		],
	],

	themeConfig: {
		image: "img/docusaurus-social-card.jpg",
		navbar: {
			title: "Comty Developers",
			logo: {
				alt: "Comty Logo",
				src: "https://comty.app/basic_alt.svg",
			},
			items: [
				// {
				// 	type: "docSidebar",
				// 	sidebarId: "docs",
				// 	position: "left",
				// 	label: "Docs",
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
							to: "/development/getting-started",
						},
						{
							label: "Español",
							to: "/es/development/getting-started",
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
