import { Icons } from "@components/Icons"

export default {
	id: "privacy",
	icon: "HatGlasses",
	label: "Privacy",
	group: "basic",
	settings: [
		{
			id: "request-data",
			group: "privacy.general",
			icon: "FileUser",
			title: "Request all my data",
			description:
				"Start the process of requesting all your data storaged from our services.",
			component: "Button",
			props: {
				type: "primary",
				children: "Request",
			},
			storaged: false,
		},
	],
	footer: () => {
		return (
			<div className="reminder">
				<Icons.FiInfo /> Take a look to our{" "}
				<a
					href="/privacy"
					target="_blank"
				>
					privacy policy
				</a>
				.
			</div>
		)
	},
}
