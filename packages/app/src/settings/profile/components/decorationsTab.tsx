import React from "react"
import { Empty, Select } from "antd"

import Icons from "@/components/Icons"
import { getDecorationPreview, isVideoDecoration } from "@/utils/decoration"

import { ProfileField, ProfileSection } from "./field"

import styles from "./decorationsTab.module.less"

const DECORATION_SLOTS = [
	{ id: "user_card_bg", label: "Profile card", icon: Icons.PanelsTopLeft },
	{ id: "avatar_frame", label: "Avatar frame", icon: Icons.CircleUserRound },
	{ id: "member_bg", label: "Member background", icon: Icons.Wallpaper },
]

const MAX_PROFILE_BADGES = 2

const DecorationOption = ({ decoration }: { decoration: any }) => {
	const preview = getDecorationPreview(decoration)

	return (
		<span className={styles.option}>
			{preview &&
				(isVideoDecoration(decoration) ? (
					<Icons.FileVideo />
				) : (
					<img
						src={preview}
						alt=""
						loading="lazy"
					/>
				))}

			{decoration.name ?? String(decoration._id)}
		</span>
	)
}

interface DecorationsTabProps {
	decorations: any[]
	badges: any[]
	selectedDecorations: Record<string, string>
	selectedBadges: string[]
	onDecorationChange: (slot: string, id?: string) => void
	onBadgeChange: (index: number, id?: string) => void
}

export const DecorationsTab = ({
	decorations,
	badges,
	selectedDecorations,
	selectedBadges,
	onDecorationChange,
	onBadgeChange,
}: DecorationsTabProps) => {
	const decorationOptions = React.useMemo(() => {
		return decorations.map((decoration) => ({
			value: String(decoration._id),
			label: <DecorationOption decoration={decoration} />,
		}))
	}, [decorations])

	const getBadgeOptions = (index: number) => {
		const otherId = selectedBadges[index === 0 ? 1 : 0]

		return badges
			.filter((badge) => String(badge._id) !== otherId)
			.map((badge) => ({
				value: String(badge._id),
				label: badge.label ?? badge.name ?? String(badge._id),
			}))
	}

	return (
		<>
			<ProfileSection
				title="Decorations"
				icon={<Icons.Sparkles />}
			>
				{decorations.length === 0 && (
					<Empty
						image={Empty.PRESENTED_IMAGE_SIMPLE}
						description="You do not own any decorations yet"
					/>
				)}

				{decorations.length > 0 &&
					DECORATION_SLOTS.map((slot) => {
						return (
							<ProfileField
								key={slot.id}
								label={slot.label}
								icon={React.createElement(slot.icon)}
							>
								<Select
									allowClear
									placeholder="None"
									value={
										selectedDecorations[slot.id] ??
										undefined
									}
									options={decorationOptions}
									onChange={(id) =>
										onDecorationChange(slot.id, id)
									}
								/>
							</ProfileField>
						)
					})}
			</ProfileSection>

			<ProfileSection
				title="Badges"
				icon={<Icons.Award />}
			>
				{badges.length === 0 && (
					<Empty
						image={Empty.PRESENTED_IMAGE_SIMPLE}
						description="You do not own any badges yet"
					/>
				)}

				{badges.length > 0 &&
					Array.from({ length: MAX_PROFILE_BADGES }, (_, index) => (
						<ProfileField
							key={index}
							label={`Badge ${index + 1}`}
						>
							<Select
								allowClear
								placeholder="None"
								value={selectedBadges[index] ?? undefined}
								options={getBadgeOptions(index)}
								onChange={(id) => onBadgeChange(index, id)}
							/>
						</ProfileField>
					))}
			</ProfileSection>
		</>
	)
}
