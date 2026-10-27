import { Icons } from "@components/Icons"

import SoundpadItems from "@components/SoundpadItems"
import SoundpadLocalVolume from "@components/SoundpadLocalVolume"
import SoundpadRandomKanker from "@components/SoundpadRandomKanker"
import SoundpadCustomUrl from "@components/SoundpadCustomUrl"

import { rtcService } from "@/rtc"

import "./index.less"

const SoundpadDialog = ({ close, group_id }) => {
	const dispatchSrc = (item) => {
		rtcService.handlers.emitClientEvent("soundpad", {
			src: item.src,
			icon: item.icon,
		})
	}

	return (
		<div className="soundpad-dialog">
			<div className="soundpad-dialog__header">
				<h1>
					<Icons.Drum /> Soundpad
				</h1>

				<SoundpadLocalVolume />
			</div>

			<SoundpadItems
				group_id={group_id}
				dispatch={dispatchSrc}
			/>

			<SoundpadCustomUrl dispatch={dispatchSrc} />

			<SoundpadRandomKanker dispatch={dispatchSrc} />
		</div>
	)
}

export const openDialog = (props) => {
	app.layout.modal.open("soundpad-dialog", <SoundpadDialog {...props} />)
}

export default SoundpadDialog
