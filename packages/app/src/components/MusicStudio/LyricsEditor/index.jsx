import React from "react"
import * as antd from "antd"

import LyricsTextView from "../LyricsTextView"
import UploadButton from "@components/UploadButton"
import { Icons } from "@components/Icons"

import MusicService from "@models/music"

import Languages from "@config/languages"

const LanguagesMap = Object.entries(Languages).map(([key, value]) => {
    return {
        label: value,
        value: key,
    }
})

import "./index.less"

const LyricsEditor = (props) => {
    const [L_TrackLyrics, R_TrackLyrics, E_TrackLyrics, F_TrackLyrics] = app.cores.api.useRequest(MusicService.getTrackLyrics, props.track._id)

    const [langs, setLangs] = React.useState([])
    const [selectedLang, setSelectedLang] = React.useState("original")

    async function onUploadLRC(uid, data) {
        const { url } = data

        setLangs((prev) => {
            const index = prev.findIndex((lang) => {
                return lang.id === selectedLang
            })

            console.log(`Replacing value for id [${selectedLang}] at index [${index}]`)

            if (index !== -1) {
                prev[index].value = url
            } else {
                const lang = LanguagesMap.find((lang) => {
                    return lang.value === selectedLang
                })

                prev.push({
                    id: lang.value,
                    name: lang.label,
                    value: url
                })
            }

            console.log(`new value =>`, prev)

            return prev
        })
    }

    React.useEffect(() => {
        if (R_TrackLyrics) {
            if (R_TrackLyrics.available_langs) {
                setLangs(R_TrackLyrics.available_langs)
            }
        }
        console.log(R_TrackLyrics)
    }, [R_TrackLyrics])

    const currentLangData = selectedLang && langs.find((lang) => {
        return lang.id === selectedLang
    })

    console.log(langs, currentLangData)

    return <div className="lyrics-editor">
        <h1>Lyrics</h1>

        <antd.Select
            showSearch
            style={{ width: "100%" }}
            placeholder="Select a language"
            value={selectedLang}
            options={[...LanguagesMap, {
                label: "Original",
                value: "original",
            }]}
            optionFilterProp="children"
            filterOption={(input, option) => (option?.label.toLowerCase() ?? '').includes(input.toLowerCase())}
            filterSort={(optionA, optionB) =>
                (optionA?.label.toLowerCase() ?? '').toLowerCase().localeCompare((optionB?.label.toLowerCase() ?? '').toLowerCase())
            }
            onChange={setSelectedLang}
        />

        <span>
            {selectedLang}
        </span>

        {
            selectedLang && <UploadButton
                onSuccess={onUploadLRC}
            />
        }

        {
            currentLangData && currentLangData?.value && <LyricsTextView
                track={props.track}
                lang={currentLangData}
            />
        }
        {
            !currentLangData || !currentLangData?.value && <antd.Empty 
                description="No lyrics available"
            />
        }
    </div>
}

export default LyricsEditor