import { AnimatePresence, motion } from "motion/react"

import Button from "@ui/Button"
import Icons from "@components/Icons"

interface JumpToBottomProps {
	visible: boolean
	onClick: () => void
}

const JumpToBottom = ({ visible, onClick }: JumpToBottomProps) => (
	<AnimatePresence>
		{visible && (
			<motion.div
				className="channel-chat__timeline__scrollToBottom"
				animate={{
					y: 0,
				}}
				exit={{
					y: 50,
				}}
				initial={{
					y: 50,
				}}
			>
				<div className="channel-chat__timeline__scrollToBottom__container bg-accent">
					<Button
						type="ghost"
						onClick={onClick}
					>
						<Icons.ArrowDownToLine /> Go to recent messages
					</Button>
				</div>
			</motion.div>
		)}
	</AnimatePresence>
)

export default JumpToBottom
