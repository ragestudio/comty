import React from "react"
import { Button, Input } from "antd"

import InventoryModel from "@endpoints/inventory"
import { Icons } from "@components/Icons"

import "./index.less"

const AccountRedeemCode = () => {
	const [code, setCode] = React.useState("")
	const [loading, setLoading] = React.useState(false)

	const handleRedeem = async () => {
		const value = code.trim()

		if (!value || loading) return

		setLoading(true)

		try {
			await InventoryModel.redeem(value)

			app.message.success("Code redeemed successfully")

			setCode("")

			const inventory = await InventoryModel.list().catch(() => null)

			if (inventory) {
				app.eventBus.emit("inventory:update", inventory)
			}
		} catch (error: any) {
			app.message.error(error.response?.data?.error ?? error.message)
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className="account-redeem-code">
			<Input
				value={code}
				onChange={(event) => setCode(event.target.value)}
				onPressEnter={handleRedeem}
				placeholder="Enter your code"
				allowClear
			/>

			<Button
				type="primary"
				icon={<Icons.Ticket />}
				loading={loading}
				disabled={!code.trim()}
				onClick={handleRedeem}
			>
				Redeem
			</Button>
		</div>
	)
}

export default AccountRedeemCode
