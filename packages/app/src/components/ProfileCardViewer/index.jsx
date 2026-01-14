import { motion, AnimatePresence } from "motion/react"
import ProProfileCard from "@components/ProProfileCard"

import "./index.less"

export const CardViewer = ({ user, decorations, close }) => {
	const [visible, setVisible] = React.useState(true)

	const triggerClose = () => {
		setVisible(false)

		setTimeout(() => {
			close()
		}, 100)
	}

	return (
		<AnimatePresence>
			{visible && (
				<motion.div
					className="user-card-viewer"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
				>
					<div
						className="user-card-viewer__trigger"
						onClick={triggerClose}
					/>

					<ProProfileCard
						title={user.username}
						username={user.username}
						avatarUrl={user.avatar}
						followersText={`${user.followers ?? 0} followers`}
						iconUrl={decorations.user_card_bg?.image_obj}
						themeColor={
							decorations.user_card_bg?.theme_color_values
						}
						showBehindGradient={false}
						enableMobileTilt={true}
					/>
				</motion.div>
			)}
		</AnimatePresence>
	)
}

export const open = ({ user, decorations }) => {
	app.cores.window_mng.render("card_viewer", <CardViewer />, {
		props: {
			user: user,
			decorations: decorations,
		},
	})
}

export default CardViewer
