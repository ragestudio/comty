import type { User } from "@comty/shared/types/user"

import UserCard from "@/components/UserCard"
import { Member } from "@/components/Spaces/Member"

import styles from "./preview.module.less"
import classNames from "classnames"

interface ProfilePreviewProps {
	user: User
	decorations: Record<string, any>
}

export const ProfilePreview = ({ user, decorations }: ProfilePreviewProps) => {
	return (
		<div className={styles.preview}>
			<div className={styles.type}>
				<h4>Cover preview</h4>

				<img
					className={classNames(
						styles.cover_preview,
						"border-default",
					)}
					src={user.cover}
				/>
			</div>

			<div className={styles.type}>
				<h4>Profile preview</h4>

				<UserCard
					user={{
						...user,
						decorations,
					}}
				/>
			</div>

			<div className={styles.type}>
				<h4>Member preview</h4>

				<Member
					connected
					decorations={decorations}
					member={{
						_id: "0",
						group_id: "0",
						user_id: user.user_id,
						roles: [],
						user: user,
					}}
				/>
			</div>
		</div>
	)
}
