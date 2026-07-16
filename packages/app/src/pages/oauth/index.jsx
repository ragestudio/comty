import React from "react"
import Button from "@ui/Button"
import { Image } from "@/components"
import { Icons } from "@/components/Icons"

import OAuth from "@models/oauth"

import "./index.less"
import { Tag } from "antd"

const ScopesBlocks = {
	openid: {
		icon: Icons.OpenId,
		title: "OpenID",
		description: "Read your account unique identifier",
	},
	email: {
		icon: Icons.Mail,
		title: "Email",
		description: "Read your email address",
	},
	profile: {
		icon: Icons.User,
		title: "Profile",
		description:
			"Read your profile information, username/name, and other details",
	},
}

const Scope = ({ id }) => {
	const scopeBlock = ScopesBlocks[id]

	if (!scopeBlock)
		return (
			<div className="oauth-consent__card__permissions__scope">
				<div className="oauth-consent__card__permissions__scope__info">
					<h3>Unknown scope</h3>
					<span>{id}</span>
				</div>
			</div>
		)

	return (
		<div className="oauth-consent__card__permissions__scope">
			<div className="oauth-consent__card__permissions__scope__icon">
				{scopeBlock.icon && React.createElement(scopeBlock.icon)}
			</div>
			<div className="oauth-consent__card__permissions__scope__info">
				<h3>{scopeBlock.title}</h3>
				<span>{scopeBlock.description}</span>
			</div>
		</div>
	)
}

const OAuthPage = (props) => {
	if (props.loaderData?.error) {
		return <div>{String(props.loaderData?.error)}</div>
	}

	const onApprove = async () => {
		const approval = await OAuth.authorize({
			action: "approve",
			client_id: props.loaderData.client_id,
			scope: props.loaderData.scope_list,
			redirect_uri: props.loaderData.redirect_uri,
			response_type: props.loaderData.response_type,
			state: props.loaderData.state,
		}).catch((e) => {
			app.cores.notifications.new({
				type: "error",
				title: "Failed to Authorize",
				message: e.response.data.error ?? String(e),
			})
			return null
		})

		if (!approval) return

		if (approval.redirect_uri) {
			window.location.href = approval.redirect_uri
		}
	}

	const onReject = () => {}

	const { client } = props.loaderData ?? {}

	return (
		<div className="oauth-consent">
			{client.logo_url && (
				<div className="oauth-consent__logo">
					<Image src={client.logo_url} />
				</div>
			)}

			<div className="oauth-consent__card card bg-accent">
				<h1>
					{!client.production && <Tag color="red">Sandbox</Tag>}
					{client?.client_name}
				</h1>
				<p>Wants to access some data</p>

				<div className="oauth-consent__card__permissions">
					<h3>Requested Permissions:</h3>
					<div className="oauth-consent__card__permissions__list">
						{props.loaderData.scope_list.map((scope) => (
							<Scope id={scope} />
						))}
					</div>
				</div>

				<div className="oauth-consent__card__actions">
					<Button
						type="primary"
						onClick={onApprove}
						icon={<Icons.CheckCircle2 />}
					>
						Approve
					</Button>
					<Button
						onClick={onReject}
						icon={<Icons.XCircle />}
					>
						Deny
					</Button>
				</div>
				<span className="oauth-consent__card__redirect-text">
					Redirects to {client.redirect_uris[0]}
				</span>
			</div>
		</div>
	)
}

OAuthPage.options = {
	layout: {
		centeredContent: true,
		maxHeight: true,
	},
}

OAuthPage.loader = async () => {
	let error = null

	const query = new URLSearchParams(window.location.search)

	const response_type = query.get("response_type")
	const client_id = query.get("client_id")
	const state = query.get("state")
	const redirect_uri = query.get("redirect_uri")

	if (!client_id) {
		return null
	}

	const scope_list = query.get("scope")?.split(" ") ?? ["openid"]

	const clientValidation = await app.cores.api
		.customRequest({
			method: "GET",
			url: `/oauth/apps/${client_id}`,
		})
		.catch((e) => {
			error = e
			return null
		})

	return {
		error: error,
		response_type: response_type,
		client_id: client_id,
		state: state,
		redirect_uri: redirect_uri,
		scope_list: scope_list,
		client: clientValidation.data,
	}
}

export default OAuthPage
