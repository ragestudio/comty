import React from "react"
import PropTypes from "prop-types"

const initialState = {
	error: null,

	// Track data
	track: null,

	// Audio state
	currentTime: 0,
	duration: 0,
	isPlaying: false,
	isLoading: false,
	playbackSpeed: 1,
	volume: 1,

	// Lyrics state
	lyrics: {},
	selectedLanguage: "original",

	// Video state
	videoSource: null,
	videoSyncTime: null,
	videoLoop: false,

	// UI state
	loading: false,
	saving: false,
	editMode: false,
}

const LyricsEditorContext = React.createContext()

function lyricsReducer(state, action) {
	switch (action.type) {
		case "SET_TRACK": {
			return { ...state, track: action.payload }
		}

		case "SET_AUDIO_PLAYING": {
			return { ...state, isPlaying: action.payload }
		}

		case "SET_AUDIO_SPEED": {
			return { ...state, playbackSpeed: action.payload }
		}

		case "SET_AUDIO_VOLUME": {
			return { ...state, volume: action.payload }
		}

		case "SET_AUDIO_LOADING": {
			return { ...state, isLoading: action.payload }
		}

		case "SET_LYRICS": {
			return {
				...state,
				lyrics: {
					original: [],
					...action.payload,
				},
			}
		}

		case "OVERRIDE_LINES": {
			return {
				...state,
				lyrics: {
					...state.lyrics,
					[state.selectedLanguage]: action.payload,
				},
			}
		}

		case "ADD_LINE": {
			let lines = state.lyrics[state.selectedLanguage] ?? []

			if (lines.find((line) => line.time === action.payload.time)) {
				return state
			}

			lines.push(action.payload)

			lines = lines.sort((a, b) => {
				if (a.time === null) return -1
				if (b.time === null) return 1
				return a.time - b.time
			})

			return {
				...state,
				lyrics: {
					...state.lyrics,
					[state.selectedLanguage]: lines,
				},
			}
		}

		case "UPDATE_LINE": {
			let lines = state.lyrics[state.selectedLanguage] ?? []

			lines = lines.map((line) => {
				if (line.time === action.payload.time) {
					return action.payload
				}

				return line
			})

			return {
				...state,
				lyrics: {
					...state.lyrics,
					[state.selectedLanguage]: lines,
				},
			}
		}

		case "REMOVE_LINE": {
			let lines = state.lyrics[state.selectedLanguage] ?? []

			lines = lines.filter((line) => line.time !== action.payload.time)

			return {
				...state,
				lyrics: {
					...state.lyrics,
					[state.selectedLanguage]: lines,
				},
			}
		}

		case "SET_SELECTED_LANGUAGE": {
			return { ...state, selectedLanguage: action.payload }
		}

		case "SET_VIDEO_SOURCE": {
			return {
				...state,
				videoSource: action.payload,
			}
		}

		case "SET_VIDEO_SYNC": {
			return {
				...state,
				videoSyncTime: action.payload,
			}
		}

		case "SET_VIDEO_LOOP": {
			return { ...state, videoLoop: action.payload }
		}

		case "SET_LOADING": {
			return { ...state, loading: action.payload }
		}

		case "SET_SAVING": {
			return { ...state, saving: action.payload }
		}

		case "RESET_STATE": {
			return { ...initialState }
		}

		default: {
			return state
		}
	}
}

export function LyricsEditorProvider({ children }) {
	const [state, dispatch] = React.useReducer(lyricsReducer, initialState)

	const value = React.useMemo(
		() => ({
			state,
			dispatch,
		}),
		[state],
	)

	return (
		<LyricsEditorContext.Provider value={value}>
			{children}
		</LyricsEditorContext.Provider>
	)
}

LyricsEditorProvider.propTypes = {
	children: PropTypes.node.isRequired,
}

export function useLyricsEditor() {
	const context = React.useContext(LyricsEditorContext)

	if (!context) {
		throw new Error(
			"useLyricsEditor must be used within a LyricsEditorProvider",
		)
	}

	return context
}

export default LyricsEditorContext
