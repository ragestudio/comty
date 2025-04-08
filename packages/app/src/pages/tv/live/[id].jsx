import React from "react"
import * as antd from "antd"
import Marquee from "react-fast-marquee"
import classnames from "classnames"

import UserPreview from "@components/UserPreview"
import { Icons } from "@components/Icons"

import LiveChat from "@components/LiveChat"
import SpectrumModel from "@models/spectrum"

import Plyr from "plyr"
import Hls from "hls.js"
import mpegts from "mpegts.js"

import "plyr/dist/plyr.css"
import "./index.less"

const DecodersEvents = {
	[Hls.Events.FPS_DROP]: (event, data) => {
		console.log("FPS_DROP Detected", data)
	},
}

const StreamDecoders = {
	flv: async (player, source, { onSourceEnd } = {}) => {
		if (!source) {
			console.error("Stream source is not defined")
			return false
		}

		const decoderInstance = mpegts.createPlayer({
			type: "flv",
			isLive: true,
			enableWorker: true,
			url: source,
		})

		if (typeof onSourceEnd === "function") {
			decoderInstance.on(mpegts.Events.ERROR, onSourceEnd)
		}

		decoderInstance.attachMediaElement(player)

		decoderInstance.load()

		await decoderInstance.play().catch((error) => {
			console.error(error)
		})

		return decoderInstance
	},
	hls: (player, source, options = {}) => {
		if (!player) {
			console.error("Player is not defined")
			return false
		}

		if (!source) {
			console.error("Stream source is not defined")
			return false
		}

		const hlsInstance = new Hls({
			maxLiveSyncPlaybackRate: 1.5,
			strategy: "bandwidth",
			autoplay: true,
			xhrSetup: (xhr) => {
				if (options.authToken) {
					xhr.setRequestHeader(
						"Authorization",
						`Bearer ${options.authToken}`,
					)
				}
			},
		})

		if (options.authToken) {
			source += `?token=${options.authToken}`
		}

		console.log("Loading media hls >", source, options)

		hlsInstance.attachMedia(player)

		// when media attached, load source
		hlsInstance.on(Hls.Events.MEDIA_ATTACHED, () => {
			hlsInstance.loadSource(source)
		})

		// process quality and tracks levels
		hlsInstance.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
			console.log(`${data.levels.length} quality levels found`)
		})

		// resume to the last position when player resume playback
		player.addEventListener("play", () => {
			console.log("Syncing to last position")
			player.currentTime = hlsInstance.liveSyncPosition
		})

		// handle errors
		hlsInstance.on(Hls.Events.ERROR, (event, data) => {
			console.error(event, data)

			switch (data.details) {
				case Hls.ErrorDetails.FRAG_LOAD_ERROR: {
					console.error(`Error loading fragment ${data.frag.url}`)
					return
				}
				default: {
					return
				}
			}
		})

		// register player decoder events
		Object.keys(DecodersEvents).forEach((event) => {
			hlsInstance.on(event, DecodersEvents[event])
		})

		return hlsInstance
	},
}

export default class StreamViewer extends React.Component {
	state = {
		isEnded: false,
		loading: true,
		cinemaMode: false,

		stream: null,
		spectators: 0,

		player: null,
		decoderInstance: null,
	}

	videoPlayerRef = React.createRef()

	loadDecoder = async (decoder, ...args) => {
		if (typeof StreamDecoders[decoder] === "undefined") {
			console.error("Protocol not supported")
			return false
		}

		await this.toggleLoading(true)

		// check if decoder is already loaded
		if (this.state.decoderInstance) {
			if (typeof this.state.decoderInstance.destroy === "function") {
				this.state.decoderInstance.destroy()
			}

			this.setState({ decoderInstance: null })
		}

		console.log(`Switching decoder to: ${decoder}`)

		const decoderInstance = await StreamDecoders[decoder](...args)

		console.log(decoderInstance)

		await this.setState({
			decoderInstance: decoderInstance,
		})

		await this.toggleLoading(false)

		return decoderInstance
	}

	loadStream = async (stream_id) => {
		let stream = await SpectrumModel.getStream(stream_id).catch((error) => {
			console.error(error)
			return null
		})

		if (!stream) {
			return false
		}

		if (Array.isArray(stream)) {
			stream = stream[0]
		}

		console.log("Stream data >", stream)

		this.setState({
			stream: stream,
			spectators: stream.viewers,
		})

		return stream
	}

	onSourceEnd = () => {
		if (typeof this.state.decoderInstance?.destroy === "function") {
			this.state.decoderInstance.destroy()
		}

		this.setState({
			isEnded: true,
			loading: false,
			cinemaMode: false,
		})
	}

	attachPlayer = () => {
		// check if user has interacted with the page
		const player = new Plyr(this.videoPlayerRef.current, {
			clickToPlay: false,
			autoplay: true,
			muted: true,
			controls: [
				"mute",
				"volume",
				"fullscreen",
				"airplay",
				"options",
				"settings",
			],
			settings: ["quality"],
		})

		player.muted = true

		// insert a button to enter to cinema mode
		player.elements.buttons.fullscreen.insertAdjacentHTML(
			"beforeBegin",
			`
            <button class="plyr__controls__item plyr__control" type="button" data-plyr="cinema">
                <span class="label">Cinema mode</span>
            </button>
        `,
		)

		player.elements.buttons.cinema =
			player.elements.container.querySelector("[data-plyr='cinema']")

		player.elements.buttons.cinema.addEventListener("click", () =>
			this.toggleCinemaMode(),
		)

		this.setState({
			player,
		})
	}

	componentDidMount = async () => {
		this.enterPlayerAnimation()
		this.attachPlayer()

		console.log("custom token> ", this.props.query["token"])

		// load stream
		const stream = await this.loadStream(this.props.params.id)

		if (!stream) {
			return this.onSourceEnd()
		}

		// load the flv decoder (by default)
		if (stream) {
			if (!stream.sources) {
				console.error("Stream sources not found")
				return
			}

			await this.loadDecoder(
				"hls",
				this.videoPlayerRef.current,
				stream.sources.hls,
				{
					onSourceEnd: this.onSourceEnd,
					authToken: this.props.query["token"],
				},
			)
		}
	}

	componentWillUnmount = () => {
		if (typeof this.state.decoderInstance?.unload === "function") {
			this.state.decoderInstance.unload()
		}

		if (typeof this.state.decoderInstance?.destroy === "function") {
			this.state.decoderInstance.destroy()
		}

		this.exitPlayerAnimation()
		this.toggleCinemaMode(false)

		if (this.streamInfoInterval) {
			clearInterval(this.streamInfoInterval)
		}
	}

	enterPlayerAnimation = () => {
		app.layout.toggleCenteredContent(false)
		app.layout.toggleTotalWindowHeight(true)

		if (app.layout.tools_bar) {
			app.layout.tools_bar.toggleVisibility(false)
		}
	}

	exitPlayerAnimation = () => {
		app.layout.toggleCenteredContent(true)
		app.layout.toggleTotalWindowHeight(false)

		if (app.layout.tools_bar) {
			app.layout.tools_bar.toggleVisibility(true)
		}
	}

	updateQuality = (newQuality) => {
		if (this.state.loadedProtocol !== "hls") {
			console.error("Unsupported protocol")
			return false
		}

		this.state.protocolInstance.levels.forEach((level, levelIndex) => {
			if (level.height === newQuality) {
				console.log("Found quality match with " + newQuality)
				this.state.protocolInstance.currentLevel = levelIndex
			}
		})
	}

	toggleLoading = (to) => {
		this.setState({ loading: to ?? !this.state.loading })
	}

	toggleCinemaMode = (to) => {
		if (typeof to === "undefined") {
			to = !this.state.cinemaMode
		}

		app.controls.toggleUIVisibility(!to)
		app.layout.toggleCompactMode(to)

		this.setState({ cinemaMode: to })
	}

	render() {
		return (
			<div
				className={classnames("livestream", {
					["cinemaMode"]: this.state.cinemaMode,
				})}
			>
				<div className="livestream_player">
					<div className="livestream_player_header">
						{this.state.stream ? (
							<>
								<div className="livestream_player_header_user">
									<UserPreview
										user_id={this.state.stream.user_id}
										onlyIcon
									/>

									<div className="livestream_player_indicators">
										{!this.state.isEnded && (
											<div className="livestream_player_header_user_spectators">
												<antd.Tag
													icon={<Icons.FiEye />}
												>
													{this.state.spectators}
												</antd.Tag>
											</div>
										)}
									</div>
								</div>

								{this.state.stream.info && (
									<div className="livestream_player_header_info">
										<div className="livestream_player_header_title">
											<h1>
												{this.state.stream.info?.title}
											</h1>
										</div>
										<div className="livestream_player_header_description">
											<Marquee mode="smooth">
												<h4>
													{
														this.state.stream.info
															?.description
													}
												</h4>
											</Marquee>
										</div>
									</div>
								)}
							</>
						) : (
							<antd.Skeleton active />
						)}
					</div>

					<video
						ref={this.videoPlayerRef}
						id="player"
						style={{
							display: this.state.isEnded ? "none" : "block",
						}}
					/>

					{this.state.isEnded && (
						<antd.Result>
							<h1>This stream is ended</h1>
						</antd.Result>
					)}

					<div
						className={classnames("livestream_player_loading", {
							["active"]: this.state.loading,
						})}
					>
						<antd.Spin />
					</div>
				</div>

				<div className="livestream_panel">
					<div className="chatbox">
						{!this.state.cinemaMode && (
							<div className="chatbox_header">
								<h4>
									<Icons.FiMessageCircle /> Live chat
								</h4>
							</div>
						)}
						<LiveChat
							id={`livestream:${this.props.params.id}`}
							floatingMode={this.state.cinemaMode}
						/>
					</div>
				</div>
			</div>
		)
	}
}
