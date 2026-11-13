import React from "react"
import { Button, Input } from "antd"
import dayjs from "dayjs"

import InventoryModel from "@endpoints/inventory"
import { Icons } from "@components/Icons"

import "./index.less"

type RedeemPreviewReward = {
	type: string
	version: number
	data: Record<string, any>
	item: Record<string, any> | null
}

type RedeemPreview = {
	code: string
	code_hint: string
	rewards: RedeemPreviewReward[]
	max_uses: number
	used_count: number
	remaining_uses: number | null
	expires_at: string | null
	already_redeemed: boolean
	owns_all: boolean
	available: boolean
}

const getRewardImage = (reward: RedeemPreviewReward) => {
	const item = reward.item

	return item?.preview_url ?? item?.obj_url ?? item?.image_obj ?? null
}

const getRewardTitle = (reward: RedeemPreviewReward) => {
	const item = reward.item

	if (item?.name) return item.name
	if (item?.label) return item.label

	if (reward.data?.kind === "badge") return "Badge"

	return "Decoration"
}

const AccountRedeemCode = () => {
	const [code, setCode] = React.useState("")
	const [preview, setPreview] = React.useState<RedeemPreview | null>(null)
	const [loading, setLoading] = React.useState(false)
	const [redeeming, setRedeeming] = React.useState(false)

	const refreshInventory = React.useCallback(async () => {
		const inventory = await InventoryModel.list().catch(() => null)

		if (inventory) {
			app.eventBus.emit("inventory:update", inventory)
		}
	}, [])

	const handleCancel = React.useCallback(() => {
		setPreview(null)
	}, [])

	const handlePreview = async () => {
		const value = code.trim()

		if (!value || loading) return

		setLoading(true)

		try {
			const response = await InventoryModel.preview(value)

			setPreview({
				...response,
				code: value,
			})
		} catch (error: any) {
			app.message.error(error.response?.data?.error ?? error.message)
		} finally {
			setLoading(false)
		}
	}

	const handleConfirm = async () => {
		if (!preview || !preview.available || redeeming) return

		setRedeeming(true)

		try {
			await InventoryModel.redeem(preview.code)

			app.message.success("Code redeemed successfully")

			setCode("")
			setPreview(null)

			await refreshInventory()
		} catch (error: any) {
			app.message.error(error.response?.data?.error ?? error.message)
		} finally {
			setRedeeming(false)
		}
	}

	const handleCodeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		setCode(event.target.value)

		if (preview) setPreview(null)
	}

	const unavailableMessage = React.useMemo(() => {
		if (!preview || preview.available) return null

		if (preview.already_redeemed) {
			return "You have already redeemed this code."
		}

		if (preview.owns_all) {
			return "You already own all the rewards of this code."
		}

		return "This code is no longer available."
	}, [preview])

	return (
		<div className="account-redeem-code">
			<div className="account-redeem-code__input">
				<Input
					value={code}
					onChange={handleCodeChange}
					onPressEnter={preview ? handleConfirm : handlePreview}
					placeholder="Enter your code"
					allowClear
				/>

				<Button
					type="primary"
					icon={<Icons.Ticket />}
					loading={loading}
					disabled={!code.trim() || !!preview}
					onClick={handlePreview}
				>
					Redeem
				</Button>
			</div>

			{preview && (
				<div className="account-redeem-code__preview bg-accent border-default">
					<div className="account-redeem-code__preview-code">
						<span>Code</span>
						<strong>{preview.code}</strong>
					</div>

					<div className="account-redeem-code__preview-meta">
						<span>
							{preview.max_uses === 0
								? "Unlimited uses"
								: `${preview.used_count} / ${preview.max_uses} uses`}
						</span>

						{preview.expires_at && (
							<span>
								Expires{" "}
								{dayjs(preview.expires_at).format(
									"YYYY-MM-DD HH:mm",
								)}
							</span>
						)}
					</div>

					<div className="account-redeem-code__rewards">
						{preview.rewards.map((reward, index) => {
							const image = getRewardImage(reward)

							return (
								<div
									key={index}
									className="account-redeem-code__reward"
								>
									<div className="account-redeem-code__reward-icon">
										{image ? (
											<img
												src={image}
												alt=""
											/>
										) : reward.data?.kind === "badge" ? (
											<Icons.Badge />
										) : (
											<Icons.Sparkles />
										)}
									</div>

									<div className="account-redeem-code__reward-info">
										<strong>
											{getRewardTitle(reward)}
										</strong>
										<span>{reward.data?.kind}</span>
									</div>
								</div>
							)
						})}
					</div>

					{unavailableMessage && (
						<p className="account-redeem-code__warning">
							{unavailableMessage}
						</p>
					)}

					<div className="account-redeem-code__actions">
						<Button
							onClick={handleCancel}
							disabled={redeeming}
						>
							Cancel
						</Button>

						<Button
							type="primary"
							icon={<Icons.Check />}
							loading={redeeming}
							disabled={!preview.available}
							onClick={handleConfirm}
						>
							Confirm redeem
						</Button>
					</div>
				</div>
			)}
		</div>
	)
}

export default AccountRedeemCode
