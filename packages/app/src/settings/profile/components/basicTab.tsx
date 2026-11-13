import type { User } from "@comty/shared/types/user"

import { Input } from "antd"

import UploadFileUrl from "@/components/UploadFileUrl"
import Icons from "@/components/Icons"

import { ProfileField, ProfileSection } from "./field"

interface BasicTabProps {
	user: User
	updateProperty: (key: keyof User, value: any) => void
}

export const BasicTab = ({ user, updateProperty }: BasicTabProps) => {
	return (
		<>
			<ProfileSection
				title="Images"
				icon={<Icons.Image />}
			>
				<ProfileField label="Avatar">
					<UploadFileUrl
						value={user.avatar}
						onChange={(value) => updateProperty("avatar", value)}
					/>
				</ProfileField>

				<ProfileField label="Cover">
					<UploadFileUrl
						value={user.cover}
						onChange={(value) => updateProperty("cover", value)}
					/>
				</ProfileField>
			</ProfileSection>

			<ProfileSection
				title="Information"
				icon={<Icons.Info />}
			>
				<ProfileField
					label="Name"
					icon={<Icons.PenLine />}
				>
					<Input
						value={user.public_name}
						onChange={(event) =>
							updateProperty("public_name", event.target.value)
						}
						maxLength={120}
						showCount
					/>
				</ProfileField>

				<ProfileField
					label="Description"
					icon={<Icons.BookOpenText />}
				>
					<Input.TextArea
						placeholder="Enter here a description for your profile"
						maxLength={320}
						value={user.description}
						onChange={(event) =>
							updateProperty("description", event.target.value)
						}
						showCount
					/>
				</ProfileField>
			</ProfileSection>
		</>
	)
}
