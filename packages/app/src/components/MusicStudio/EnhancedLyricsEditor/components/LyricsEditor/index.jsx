import React from "react"
import * as antd from "antd"

import LyricsTextView from "@components/MusicStudio/LyricsTextView"
import UploadButton from "@components/UploadButton"
import { Icons } from "@components/Icons"

import Languages from "@config/languages"

import "./index.less"

const LanguagesMap = Object.entries(Languages).map(([key, value]) => {
	return {
		label: value,
		value: key,
	}
})

const LyricsEditor = (props) => {
	const { langs = {} } = props
	const [selectedLang, setSelectedLang] = React.useState("original")

	function handleChange(key, value) {
		if (typeof props.onChange !== "function") {
			return false
		}

		props.onChange(key, value)
	}

	function updateCurrentLang(url) {
		handleChange("langs", {
			...langs,
			[selectedLang]: url,
		})
	}

	return (
		<div className="lyrics-editor">
			<div className="flex-row align-center justify-space-between gap-10">
				<h1>
					<Icons.MdOutlineMusicNote />
					Lyrics
				</h1>

				<div className="flex-row aling-center gap-5">
					<span>Language:</span>

					<antd.Select
						showSearch
						style={{ width: "220px" }}
						placeholder="Select a language"
						value={selectedLang}
						options={[
							...LanguagesMap,
							{
								label: "Original",
								value: "original",
							},
						]}
						optionFilterProp="children"
						filterOption={(input, option) =>
							(option?.label.toLowerCase() ?? "").includes(
								input.toLowerCase(),
							)
						}
						filterSort={(optionA, optionB) =>
							(optionA?.label.toLowerCase() ?? "")
								.toLowerCase()
								.localeCompare(
									(
										optionB?.label.toLowerCase() ?? ""
									).toLowerCase(),
								)
						}
						onChange={setSelectedLang}
					/>

					{selectedLang && (
						<UploadButton
							onSuccess={(file_uid, data) => {
								updateCurrentLang(data.url)
							}}
							accept={["text/*"]}
						/>
					)}
				</div>
			</div>

			{!langs[selectedLang] && (
				<span>No lyrics uploaded for this language</span>
			)}

			{langs[selectedLang] && (
				<LyricsTextView lrcURL={langs[selectedLang]} />
			)}
		</div>
	)
}

export default LyricsEditor
