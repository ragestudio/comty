import React from "react"
import * as antd from "antd"

import { Icons } from "@components/Icons"
import SelectableText from "@components/SelectableText"

import useGetMainOrigin from "@hooks/useGetMainOrigin"
import textToDownload from "@utils/textToDownload"
import ServerKeysModel from "@models/api"

import BotManifestCreator from "./components/BotManifestCreator"

import "./index.less"

const ServerKeyCreator = (props) => {
	const [name, setName] = React.useState("")
	const [access, setAccess] = React.useState(null)

	const [result, setResult] = React.useState(null)
	const [error, setError] = React.useState(null)

	const canSubmit = () => {
		return name && access
	}

	const onSubmit = async () => {
		if (!canSubmit()) {
			return
		}

		const result = await ServerKeysModel.createNewServerKey({
			name,
			access,
		})

		if (result) {
			setResult(result)
		}
	}

	const onRegenerate = async () => {
		app.layout.modal.confirm({
			headerText: "Regenerate secret token",
			descriptionText:
				"When a key is regenerated, the old secret token will be replaced with a new one. This action cannot be undone.",
			onConfirm: async () => {
				await ServerKeysModel.regenerateSecretToken(result.access_id)
					.then((data) => {
						app.message.info("Secret token regenerated")
						setResult(data)
					})
					.catch((error) => {
						app.message.error(error.message)
						setError(error.message)
					})
			},
		})
	}

	const onDelete = async () => {
		app.layout.modal.confirm({
			headerText: "Delete server key",
			descriptionText:
				"Deleting this server key will remove it from your account. This action cannot be undone.",
			onConfirm: async () => {
				await ServerKeysModel.deleteServerKey(result.access_id)
					.then(() => {
						app.message.info("Server key deleted")
						props.close()
					})
					.catch((error) => {
						app.message.error(error.message)
						setError(error.message)
					})
			},
		})
	}

	async function generateAuthJSON() {
		const data = {
			name: result.name,
			access: result.access,
			access_id: result.access_id,
			secret_token: result.secret_token,
		}

		await textToDownload(
			JSON.stringify(data),
			`comtyapi-${result.name}-auth.json`,
		)
	}

	React.useEffect(() => {
		if (props.data) {
			setResult(props.data)
		}
	}, [])

	if (result) {
		return (
			<div className="server-key-creator">
				<h1>Your server key</h1>

				<p>Name: {result.name}</p>

				<div className="server-key-creator-info">
					<span>Access ID:</span>
					<SelectableText>{result.access_id}</SelectableText>
				</div>

				{result.secret_token && (
					<div className="server-key-creator-info">
						<span>Secret:</span>
						<SelectableText>{result.secret_token}</SelectableText>
					</div>
				)}

				{result.secret_token && (
					<antd.Alert
						type="warning"
						message="Save these credentials in a safe place. You can't see them again."
					/>
				)}

				{result.secret_token && (
					<antd.Button
						onClick={generateAuthJSON}
						type="primary"
					>
						Save JSON
					</antd.Button>
				)}

				{!result.secret_token && (
					<antd.Button
						type="primary"
						onClick={() => onRegenerate()}
					>
						Regenerate secret
					</antd.Button>
				)}

				<antd.Button
					danger
					onClick={() => onDelete()}
				>
					Delete
				</antd.Button>

				<antd.Button onClick={() => props.close()}>Ok</antd.Button>
			</div>
		)
	}

	return (
		<>
			<h1>Create a server key</h1>

			<antd.Form
				layout="vertical"
				onFinish={onSubmit}
			>
				<antd.Form.Item
					label="Name"
					name="name"
					rules={[
						{
							required: true,
							message: "Name is required",
						},
					]}
				>
					<antd.Input onChange={(e) => setName(e.target.value)} />
				</antd.Form.Item>

				<antd.Form.Item
					label="Access"
					name="access"
					rules={[
						{
							required: true,
							message: "Access is required",
						},
					]}
				>
					<antd.Select onChange={(e) => setAccess(e)}>
						<antd.Select.Option value="read">
							Read
						</antd.Select.Option>
						<antd.Select.Option value="write">
							Write
						</antd.Select.Option>
						<antd.Select.Option value="readWrite">
							Read/Write
						</antd.Select.Option>
					</antd.Select>
				</antd.Form.Item>

				<antd.Form.Item>
					<antd.Button
						type="primary"
						htmlType="submit"
						disabled={!canSubmit()}
					>
						Create
					</antd.Button>
				</antd.Form.Item>

				{error && (
					<antd.Form.Item>
						<antd.Alert
							type="error"
							message={error}
						/>
					</antd.Form.Item>
				)}
			</antd.Form>
		</>
	)
}

const ServerKeyItem = (props) => {
	const { name, access_id } = props.data

	return (
		<div className="server-key-item">
			<div className="server-key-item-info">
				<p>{name}</p>
				<span>{access_id}</span>
			</div>

			<div className="server-key-item-actions">
				<antd.Button
					size="small"
					icon={<Icons.TbEdit />}
					onClick={() => props.onEdit(props.data)}
				/>
			</div>
		</div>
	)
}

export default {
	id: "api",
	icon: "Cable",
	label: "API",
	group: "advanced",
	render: () => {
		const mainOrigin = useGetMainOrigin()

		const [L_Keys, R_Keys, E_Keys, F_Keys] = app.cores.api.useRequest(
			ServerKeysModel.getMyServerKeys,
		)

		async function onClickCreateNewBot() {
			app.layout.drawer.open("bot_manifest_creator", BotManifestCreator, {
				onClose: () => {
					F_Keys()
				},
				confirmOnOutsideClick: true,
				confirmOnOutsideClickText: "All changes will be lost.",
			})
		}

		async function onClickCreateNewKey() {
			app.layout.drawer.open("server_key_creator", ServerKeyCreator, {
				onClose: () => {
					F_Keys()
				},
				confirmOnOutsideClick: true,
				confirmOnOutsideClickText: "All changes will be lost.",
			})
		}

		async function onClickEditKey(key) {
			app.layout.drawer.open("server_key_creator", ServerKeyCreator, {
				props: {
					data: key,
				},
				onClose: () => {
					F_Keys()
				},
			})
		}

		return (
			<div className="developer-settings">
				<div className="card">
					<h3>Main Origin</h3>
					<p>{mainOrigin}</p>
				</div>

				<div className="card api_keys">
					<div className="api_keys_header">
						<div className="api_keys_header_title">
							<h3>Your Keys</h3>
							<p>Manage your API keys</p>
						</div>

						<antd.Button
							type="primary"
							onClick={onClickCreateNewKey}
						>
							Create new
						</antd.Button>
					</div>

					<div className="api_keys_list">
						{L_Keys && <antd.Skeleton active />}

						{E_Keys && (
							<antd.Result
								status="warning"
								title="Failed to retrieve keys"
								subTitle={E_Keys.message}
							/>
						)}

						{!E_Keys && !L_Keys && (
							<>
								{R_Keys.map((data, index) => {
									return (
										<ServerKeyItem
											key={index}
											data={data}
											onEdit={onClickEditKey}
										/>
									)
								})}
								{R_Keys.length === 0 && <antd.Empty />}
							</>
						)}
					</div>
				</div>

				<div className="card bot-manifests">
					<div className="bot-manifests__header">
						<div className="bot-manifests__header__title">
							<h4>Your Bots</h4>
							<p>Manage your bots manifests & keys </p>
						</div>

						<antd.Button
							type="primary"
							onClick={onClickCreateNewBot}
						>
							Create new
						</antd.Button>
					</div>
				</div>

				<div className="card">
					<h3>Documentations</h3>

					<div className="links">
						<a>Comty CLI</a>
						<a>Comty.JS for NodeJS</a>
						<a>Comty Extensions SDK</a>
						<a>Spectrum API</a>
					</div>
				</div>
			</div>
		)
	},
}
