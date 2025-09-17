import { Icons } from "@components/Icons"

import SoundpadItems from "@components/SoundpadItems"
import SoundpadLocalVolume from "@components/SoundpadLocalVolume"
import SoundpadRandomKanker from "@components/SoundpadRandomKanker"
import SoundpadCustomUrl from "@components/SoundpadCustomUrl"

import "./index.less"

const SoundpadDialog = ({ close, group_id }) => {
	const dispatchSrc = (src) => {
		app.cores.mediartc.handlers().soundpadDispatch({
			src: src,
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

			<SoundpadCustomUrl
				group_id={group_id}
				dispatch={dispatchSrc}
			/>

			<SoundpadRandomKanker
				group_id={group_id}
				dispatch={dispatchSrc}
			/>
		</div>
	)
}

export const openDialog = (props) => {
	app.layout.modal.open("soundpad-dialog", <SoundpadDialog {...props} />)
}

export default SoundpadDialog
