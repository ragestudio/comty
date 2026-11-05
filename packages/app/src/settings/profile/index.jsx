import React from "react"
import { Button, Input } from "antd"

import loadable from "@loadable/component"
import UserModel from "@endpoints/user"
import UploadButton from "@components/UploadButton"
import { Icons } from "@components/Icons"
import applyUserUpdate from "../../auth/userUpdate"

import "./index.less"

const AvatarUploadButton = (props) => (
	<UploadButton
		{...props}
		accept="image/*"
		beforeUpload={(file) => {
			if (!file.type?.startsWith("image/")) {
				app.message.error("Please select a valid image file for your avatar.")
				return false
			}

			return true
		}}
	/>
)

const AvatarEditor = (props) => {
	const [mode, setMode] = React.useState("upload")
	const [url, setUrl] = React.useState("")
	const [removing, setRemoving] = React.useState(false)
	const [customAvatar, setCustomAvatar] = React.useState(
		props.ctx.processedCtx.userData?.avatar_is_custom === true,
	)

	const removeAvatar = async () => {
		setRemoving(true)
		try {
			const result = await props.ctx.dispatchUpdate(null)
			if (result !== false) setCustomAvatar(false)
		} finally {
			setRemoving(false)
		}
	}

	const uploadContext = {
		...props.ctx,
		onUpdateItem: async (value) => {
			const result = await props.ctx.onUpdateItem(value)
			if (result !== false) setCustomAvatar(true)
			return result
		},
	}

	const saveExternalUrl = async () => {
		const result = await props.ctx.dispatchUpdate(url)
		if (result !== false) setCustomAvatar(true)
	}

	return (
		<div>
			{props.ctx.currentValue && (
				<div
					className="profile-avatar-preview"
				>
					<img src={props.ctx.currentValue} />
					{customAvatar && (
						<Button
							aria-label="Remove avatar"
							title="Remove avatar"
							icon={<Icons.X size={16} />}
							danger
							loading={removing}
							disabled={removing}
							onClick={removeAvatar}
						/>
					)}
				</div>
			)}

			<div className="profile-avatar-actions">
				<div onClick={() => setMode("upload")}>
					<AvatarUploadButton ctx={uploadContext}>
						Upload image
					</AvatarUploadButton>
				</div>
				<Button
					type="default"
					onClick={() => setMode("url")}
				>
					Use external URL
				</Button>
			</div>

			{mode === "url" && (
				<div className="profile-avatar-url-form">
					<Input
						className="profile-avatar-url-input"
						value={url}
						onChange={(event) => setUrl(event.target.value)}
						placeholder="Image URL..."
					/>
					<Button onClick={saveExternalUrl}>
						Save
					</Button>
				</div>
			)}
		</div>
	)
}

export default {
	id: "profile",
	icon: "User",
	label: "Profile",
	group: "basic",
	ctxData: async () => {
		const userData = await UserModel.data()

		return {
			userData,
		}
	},
	settings: [
		{
			id: "username",
			group: "account.basicInfo",
			component: "Button",
			icon: "AtSign",
			title: "Username",
			description:
				"Your username is the name you use to log in to your account.",
			props: {
				disabled: true,
				children: "Change username",
			},
		},
		{
			id: "public_name",
			group: "account.basicInfo",
			component: "Input",
			icon: "PenLine",
			title: "Name",
			description: "Change your public name",
			props: {
				maxLength: 120,
				showCount: true,
				allowClear: { clearIcon: <Icons.CircleX /> },
				placeholder: "Enter your name. e.g. John Doe",
			},
			defaultValue: (ctx) => {
				return ctx.userData.public_name
			},
			onUpdate: async (value) => {
				const result = await UserModel.updateData({
					public_name: value,
				})

				if (result) {
					app.message.success("Public name updated")
					return value
				}
			},
			extraActions: [
				{
					id: "unset",
					icon: "Delete",
					title: "Unset",
					onClick: async () => {
						await UserModel.unsetPublicName()
					},
				},
			],
			debounced: true,
			storaged: false,
		},
		{
			id: "email",
			group: "account.basicInfo",
			component: "Input",
			icon: "Mail",
			title: "Email",
			description: "Change your email address",
			props: {
				placeholder: "Enter your email address",
				allowClear: { clearIcon: <Icons.CircleX /> },
				showCount: true,
				maxLength: 320,
			},
			defaultValue: (ctx) => {
				return ctx.userData.email
			},
			onUpdate: async (value) => {
				const result = await UserModel.updateData({
					email: value,
				})

				if (result) {
					return value
				}
			},
			debounced: true,
		},
		{
			id: "avatar",
			group: "account.profile",
			icon: "SquareUser",
			title: "Avatar",
			description: "Change your avatar (Upload an image or use an URL)",
			component: AvatarEditor,
			extraActions: [],
			defaultValue: (ctx) => {
				return ctx.userData.avatar
			},
			onUpdate: async (value) => {
				const result = await UserModel.updateData({
					avatar: value,
				})

				if (result) {
					applyUserUpdate(result)
					app.message.success("Avatar updated")
					return result.avatar
				}
			},
		},
		{
			id: "cover",
			group: "account.profile",
			icon: "Image",
			title: "Cover",
			description:
				"Change your profile cover (Upload an image or use an URL)",
			component: loadable(() => import("../components/urlInput")),
			extraActions: [UploadButton],
			defaultValue: (ctx) => {
				return ctx.userData.cover
			},
			onUpdate: async (value) => {
				const result = await UserModel.updateData({
					cover: value,
				})

				if (result) {
					app.message.success("Cover updated")
					return value
				}
			},
		},
		{
			id: "description",
			group: "account.profile",
			component: "TextArea",
			icon: "BookOpenText",
			title: "Description",
			description: "Change your description for your profile",
			props: {
				placeholder: "Enter here a description for your profile",
				maxLength: 320,
				showCount: true,
				allowClear: { clearIcon: <Icons.CircleX /> },
			},
			defaultValue: (ctx) => {
				return ctx.userData.description
			},
			onUpdate: async (value) => {
				const result = await UserModel.updateData({
					description: value,
				})

				if (result) {
					return value
				}
			},
			debounced: true,
		},
		{
			id: "Links",
			group: "account.profile",
			component: loadable(() => import("../components/profileLinks")),
			icon: "Link2",
			title: "Links",
			description: "Add links to your profile",
			onUpdate: async (value) => {
				// filter invalid links
				value = value.filter((link) => {
					return link.key && link.value
				})

				const result = await UserModel.updateData({
					links: value,
				})

				if (result) {
					return result.links
				}
			},
			defaultValue: (ctx) => {
				return ctx.userData.links ?? []
			},
			debounced: true,
		},
	],
}
