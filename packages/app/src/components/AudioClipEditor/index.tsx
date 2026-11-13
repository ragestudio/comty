import React from "react"
import { Skeleton } from "antd"

import EditorActions from "./components/EditorActions"
import EditorHeader from "./components/EditorHeader"
import RangeControls from "./components/RangeControls"
import Waveform from "./components/Waveform"

import useAudioClipEditor from "./useAudioClipEditor"
import { b } from "./style"

import type { AudioClipEditorProps, OpenAudioClipEditorOptions } from "./types"

export type {
	AudioClipEditorProps,
	AudioClipRange,
	OpenAudioClipEditorOptions,
} from "./types"

const AudioClipEditor = ({
	source,
	title = "Edit audio clip",
	maxDuration = Number.POSITIVE_INFINITY,
	initialRange,
	close,
	onSave,
}: AudioClipEditorProps) => {
	const editor = useAudioClipEditor({
		source,
		maxDuration,
		initialRange,
		close,
		onSave,
	})

	return (
		<div className={b()}>
			<EditorHeader
				title={title}
				disabled={editor.saving}
				onClose={close}
			/>

			{editor.loading && <Skeleton active />}

			{!editor.loading && editor.error && (
				<p className={b.elem("error")}>{editor.error}</p>
			)}

			{!editor.loading && !editor.error && editor.buffer && (
				<>
					<Waveform
						buffer={editor.buffer}
						peaks={editor.peaks}
						start={editor.start}
						end={editor.end}
					/>

					<RangeControls
						duration={editor.duration}
						start={editor.start}
						end={editor.end}
						maxDuration={maxDuration}
						onStartChange={editor.handleStartChange}
						onEndChange={editor.handleEndChange}
					/>

					<EditorActions
						playing={editor.playing}
						saving={editor.saving}
						onPreview={editor.playSelection}
						onStop={editor.stopPreview}
						onCancel={close}
						onSave={editor.handleSave}
					/>
				</>
			)}
		</div>
	)
}

export const openAudioClipEditor = (options: OpenAudioClipEditorOptions) => {
	const { id = "audio-clip-editor", contentStyle, ...props } = options

	app.layout.modal.open(id, AudioClipEditor, {
		props: {
			...props,
			contentStyle: {
				width: "min(640px, 90vw)",
				maxWidth: "90vw",
				...contentStyle,
			},
		},
	})
}

export default AudioClipEditor
