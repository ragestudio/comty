import type { User } from "@comty/shared/types/user"
import styles from "./editor.module.less"

import classNames from "clsx"
import UserCard from "@/components/UserCard"
import createBem from "@/utils/createBem"
import Icons from "@/components/Icons"
import UploadFileUrl from "@/components/UploadFileUrl"

import useObjectUpdate from "@/hooks/useObjectUpdate"
import Button from "@/ui/Button"
import { Input } from "antd"
import UserModel from "@endpoints/user"

const container = createBem("profile-editor", styles)
const content = container.sub("content")
const field = content.sub("field")

export const ProfileEditor = (props) => {
	const initialUserData = props.ctx.processedCtx.userData as User
	const updatedUserData = useObjectUpdate<User>(initialUserData)

	const handleSave = async () => {
		const changes = Object.keys(updatedUserData.current).reduce((prev, key) => {
			if (initialUserData[key] !== updatedUserData.current[key]) {
				prev[key] = updatedUserData.current[key]
			}

			return prev
		}, {})

		const result = await UserModel.updateData(changes)

		props.ctx.dispatchUpdate(result)
	}

	return (
		<div className={classNames(container())}>
			<div className={container.elem("preview")}>
				<UserCard user={updatedUserData.current} />
			</div>

			<div className={content()}>
				<div className={field()}>
					<h4>
						<Icons.Image /> Images
					</h4>

					<div className={field()}>
						<span>Avatar</span>

						<UploadFileUrl
							value={updatedUserData.current.avatar}
							onChange={(value) =>
								updatedUserData.updateProperty("avatar", value)
							}
						/>
					</div>

					<div className={field()}>
						<span>Cover</span>

						<UploadFileUrl
							value={updatedUserData.current.cover}
							onChange={(value) =>
								updatedUserData.updateProperty("cover", value)
							}
						/>
					</div>
				</div>

				<div className={field()}>
					<h4>
						<Icons.Info /> Information
					</h4>

					<div className={field()}>
						<span>
							<Icons.PenLine /> Name
						</span>

						<Input
							value={updatedUserData.current.public_name}
							onChange={(e) =>
								updatedUserData.updateProperty("public_name", e.target.value)
							}
							maxLength={120}
							showCount
						/>
					</div>

					<div className={field()}>
						<div className={field.elem("header")}>
							<span>
								<Icons.BookOpenText />
								Description
							</span>
						</div>

						<Input.TextArea
							placeholder="Enter here a description for your profile"
							maxLength={320}
							value={updatedUserData.current.description}
							onChange={(e) =>
								updatedUserData.updateProperty("description", e.target.value)
							}
							showCount
						/>
					</div>
				</div>

				<div className={container.elem("actions")}>
					{updatedUserData.hasChanges && (
						<Button
							icon={<Icons.ArrowBigLeft />}
							onClick={updatedUserData.restore}
						>
							Revert
						</Button>
					)}
					<Button
						icon={<Icons.Save />}
						disabled={!updatedUserData.hasChanges}
						type={updatedUserData.hasChanges ? "primary" : "default"}
						onClick={handleSave}
					>
						Save
					</Button>
				</div>
			</div>
		</div>
	)
}

export default ProfileEditor
