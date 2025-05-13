// @ts-check
// `@type` JSDoc annotations allow editor autocompletion and type checking
// (when paired with `@ts-check`).
// There are various equivalent ways to declare your Docusaurus config.
// See: https://docusaurus.io/docs/api/docusaurus-config

import { themes as prismThemes } from "prism-react-renderer"

/** @type {import("@docusaurus/types").Config} */
const config = {
	title: "Comty Documentation",
	tagline: "The place for developers",
	favicon: "img/favicon.ico",

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
			/** @type {import("@docusaurus/preset-classic").Options} */
			({
				docs: {
					path: "../docs",
					sidebarPath: "./sidebars.js",
					//editUrl: "https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/",
				},
				theme: {
					customCss: "./src/css/custom.css",
				},
			}),
		],
	],

	themeConfig:
		/** @type {import("@docusaurus/preset-classic").ThemeConfig} */
		({
			// Replace with your project"s social card
			image: "img/docusaurus-social-card.jpg",
			navbar: {
				title: "Comty Developers",
				logo: {
					alt: "Comty Logo",
					src: "https://storage.ragestudio.net/rstudio/branding/comty/iso/logo_alt.svg",
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
				],
			},
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
		}),
}

export default config
