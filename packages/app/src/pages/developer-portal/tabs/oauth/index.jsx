import React from "react"
import * as antd from "antd"
import Button from "@ui/Button"
import HiddenText from "@components/HiddenText"
import UploadButton from "@components/UploadButton"

import isURL from "@utils/isURL"

import { Icons } from "@components/Icons"

import use from "comty.js/hooks/use"
import OAuthModel from "@models/oauth"

import "./index.less"

const AppInfoDialog = (props) => {
	const [newSecret, setNewSecret] = React.useState(null)
	const [update, setUpdate] = React.useState(null)
	const [loading, setLoading] = React.useState(false)

	const handleUpdate = async () => {
		setLoading(true)

		try {
			await OAuthModel.updateApp(props.app.client_id, update)
			setUpdate(null)
			app.message.success("app updated")
			if (typeof props.close === "function") {
				props.close()
			}
		} catch (err) {
			app.message.error("failed to update app")
		} finally {
			setLoading(false)
		}
	}

	const handleDelete = () => {
		app.layout.modal.confirm({
			headerText: "delete this app?",
			descriptionText: "all existing authorizations will be revoked",
			onConfirm: async () => {
				try {
					await OAuthModel.deleteApp(props.app.client_id)
					app.message.success("app deleted")

					if (typeof props.close === "function") {
						props.close()
					}
				} catch (err) {
					app.message.error("failed to delete")
				}
			},
		})
	}

	const handleRegenerate = () => {
		app.layout.modal.confirm({
			headerText: "regenerate client secret?",
			descriptionText: "the old secret will stop working immediately",
			onConfirm: async () => {
				try {
					const res = await OAuthModel.regenerateSecret(
						props.app.client_id,
					)

					setNewSecret(res.client_secret)
				} catch (err) {
					app.message.error("failed to regenerate secret")
				}
			},
		})
	}

	const updateFields = (key, value) => {
		setUpdate((prev) => {
			if (!prev) {
				prev = {}
			}

			return {
				...prev,
				[key]: value,
			}
		})
	}

	// TODO: implement a proper deep object comparison
	const hasChanges = () => {
		return update !== null
	}

	return (
		<div className="oauth-app-info">
			<div className="oauth-app-info__data">
				<div className="oauth-app-info__data__field">
					<span>Client Name</span>

					<antd.Input
						defaultValue={props.app.client_name}
						onChange={(e) =>
							updateFields("client_name", e.target.value)
						}
					/>
				</div>

				<div className="oauth-app-info__data__field">
					<span>Client ID</span>

					<HiddenText
						value={props.app.client_id}
						defaultVisible={true}
					/>
				</div>

				<div className="oauth-app-info__data__field">
					<span>Icon</span>

					<UploadButton
						onSuccess={(file_uid, response) =>
							updateFields("logo_url", response.url)
						}
					/>
				</div>

				<div className="oauth-app-info__data__field">
					<span>Website</span>

					<antd.Input
						defaultValue={props.app.website_url}
						onChange={(e) =>
							updateFields("website_url", e.target.value)
						}
					/>
				</div>

				{newSecret && (
					<div className="oauth-app-info__data__field">
						<span>Secret Key</span>
						<antd.Alert
							type="warning"
							description="This is your secret key. Keep it safe and do not share it with anyone. Once you leave this page, the secret key will be hidden."
						/>

						<HiddenText value={newSecret} />
					</div>
				)}

				{props.app.redirect_uris?.length > 0 && (
					<div className="oauth-app-info__data__field">
						<span>Redirect uris</span>

						<ul className="oauth-dev-page__uris">
							{props.app.redirect_uris.map((uri) => (
								<li key={uri}>{uri}</li>
							))}
						</ul>
					</div>
				)}
			</div>

			<div className="oauth-app-info__actions">
				<Button
					onClick={handleRegenerate}
					icon={<Icons.RefreshCcw />}
					disabled={loading}
				>
					Regenerate Secret
				</Button>
				<Button
					onClick={handleUpdate}
					icon={<Icons.Save />}
					disabled={!hasChanges()}
					loading={loading}
				>
					Save changes
				</Button>

				<div className="oauth-app-info__actions__right">
					<Button
						type="danger"
						onClick={handleDelete}
						disabled={loading}
					>
						Delete
					</Button>
				</div>
			</div>
		</div>
	)
}

const AppCreateDialog = (props) => {
	const [newAppName, setNewAppName] = React.useState("")
	const [redirectUris, setRedirectUris] = React.useState([])
	const [loading, setLoading] = React.useState(false)

	const handleCreate = async () => {
		if (!newAppName.trim()) return

		setLoading(true)

		try {
			await OAuthModel.createApp({
				client_name: newAppName.trim(),
				redirect_uris: redirectUris,
			})

			if (typeof props.close === "function") {
				props.close()
			}
		} catch (err) {
			app.message.error("failed to create app")
		} finally {
			setNewAppName("")
			setLoading(false)
		}
	}

	const handleRedirectUrisChange = (changes) => {
		setRedirectUris(changes)
	}

	const canCreate = () => {
		const validUrls = redirectUris.filter((uri) => {
			return uri.trim().length > 0 && isURL(uri)
		})

		return newAppName.trim().length > 0 && validUrls.length > 0
	}

	return (
		<div className="oauth-app-create">
			<h3>Create new OAuth Application</h3>

			<div className="oauth-app-create__fields">
				<div className="oauth-app-create__fields__field">
					<span>Application name</span>
					<antd.Input
						placeholder="My Example Application"
						value={newAppName}
						onChange={(e) => setNewAppName(e.target.value)}
					/>
				</div>

				<div className="oauth-app-create__fields__field">
					<span>Redirect URIs</span>
					<antd.Select
						mode="tags"
						onChange={handleRedirectUrisChange}
						placeholder="https://example.com/oauth/callback"
						status={redirectUris.length === 0 ? "error" : undefined}
					/>
				</div>
			</div>

			<div className="oauth-app-create__actions">
				<Button
					onClick={handleCreate}
					loading={loading}
					type="primary"
					icon={<Icons.CheckCircle />}
					disabled={!canCreate()}
				>
					Submit
				</Button>
			</div>
		</div>
	)
}

const OAuth = (props) => {
	const { result: apps, repeat, error, loading } = use(OAuthModel.getMyApps)

	const onClickAppItem = (item) => {
		app.layout.modal.open("oauth-app-edit", AppInfoDialog, {
			props: {
				app: item,
			},
			onClose: () => {
				repeat()
			},
		})
	}

	const onClickCreate = () => {
		app.layout.modal.open("oauth-app-create", AppCreateDialog, {
			onClose: () => {
				repeat()
			},
		})
	}

	return (
		<div className="oauth-dev-page">
			<div className="oauth-dev-page__header">
				<h3>OAuth Applications</h3>
				<Button
					type="primary"
					onClick={onClickCreate}
					icon={<Icons.PlusCircle />}
				>
					Create new
				</Button>
			</div>

			{error && (
				<antd.Result
					status="warning"
					title="Error loading apps"
					subTitle={error.message}
				/>
			)}

			{loading && <antd.Skeleton />}

			{!error && !loading && (
				<div className="oauth-dev-page__list">
					{apps.map((app) => (
						<div
							key={app.client_id}
							className="oauth-dev-page__list__item"
						>
							<div className="oauth-dev-page__list__item__info">
								<span>{app.client_name}</span>
								<code>{app.client_id}</code>

								{app.production && (
									<antd.Tag color="green">
										Production
									</antd.Tag>
								)}
								{!app.production && (
									<antd.Tag color="red">Sandbox</antd.Tag>
								)}
							</div>

							<div className="oauth-dev-page__list__item__btn">
								<Button onClick={() => onClickAppItem(app)}>
									Edit
								</Button>
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	)
}

export default OAuth
