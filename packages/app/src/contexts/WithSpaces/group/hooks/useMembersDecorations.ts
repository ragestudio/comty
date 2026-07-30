import type { Member } from "../../collections/member"

import React from "react"
import UsersModel from "@models/user"

export const useMembersDecorations = () => {
	const [membersDecorations, setMembersDecorations] = React.useState<
		Record<string, any>
	>({})
	const fetchedDecorationsRef = React.useRef<Set<string>>(new Set())

	const evaluateMembersDecorations = React.useCallback(
		async (membersList: Member[]) => {
			if (!membersList || membersList.length === 0) return

			const missingIds = membersList
				.map((m) => m.user_id)
				.filter((id) => !fetchedDecorationsRef.current.has(id))

			if (missingIds.length === 0) return

			for (const id of missingIds) {
				fetchedDecorationsRef.current.add(id)
			}

			console.debug(
				"[decorations] fetching missing decorations for:",
				missingIds.length,
				"users",
			)

			try {
				const users_ids = missingIds.join(",")
				const fetchedData =
					await UsersModel.V2.decorations.get(users_ids)

				if (Array.isArray(fetchedData)) {
					setMembersDecorations((prev) => {
						const newDecorationsDict = fetchedData.reduce(
							(acc: Record<string, any>, curr: any) => {
								acc[curr.user_id] = curr.decorations || {}
								return acc
							},
							{},
						)

						return { ...prev, ...newDecorationsDict }
					})
				}
			} catch (err) {
				console.error("[decorations] Failed to fetch decorations:", err)

				for (const id of missingIds) {
					fetchedDecorationsRef.current.delete(id)
				}
			}
		},
		[],
	)

	return {
		membersDecorations,
		setMembersDecorations,
		fetchedDecorationsRef,
		evaluateMembersDecorations,
	}
}
