import { Icons } from "@components/Icons"

import StickersBrowser from "@components/StickersBrowser"

import "./StickersButton.less"

const StickersButton = ({ onClickItem }) => {
	const openModal = () => {
		app.layout.modal.open("stickers-browser", StickersBrowser, {
			props: {
				onClickItem: onClickItem,
			},
		})
	}

	return (
		<div
			className="stickers-button"
			onClick={() => openModal()}
		>
			<Icons.Sticker />
		</div>
	)
}

export default StickersButton
