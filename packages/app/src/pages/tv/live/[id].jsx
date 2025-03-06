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
	hls: (player, source) => {
		if (!source) {
			console.error("Stream source is not defined")
			return false
		}

		const hlsInstance = new Hls({
			autoStartLoad: true,
		})

		hlsInstance.attachMedia(player.current)

		hlsInstance.on(Hls.Events.MEDIA_ATTACHED, () => {
			hlsInstance.loadSource(source)

			hlsInstance.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
				console.log(`${data.levels.length} quality levels found`)
			})
		})

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

		await this.setState({
			decoderInstance: decoderInstance,
		})

		await this.toggleLoading(false)

		return decoderInstance
	}

	loadStream = async (stream_id) => {
		let stream = await SpectrumModel.getLivestream(stream_id).catch(
			(error) => {
				console.error(error)
				return null
			},
		)

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

		this.state.player.destroy()

		this.setState({
			isEnded: true,
			loading: false,
			cinemaMode: false,
		})
	}

	attachPlayer = () => {
		// check if user has interacted with the page
		const player = new Plyr("#player", {
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

		const stream_id = this.props.params.id

		console.log("Stream ID >", stream_id)

		this.attachPlayer()

		// get stream info
		const stream = await this.loadStream(stream_id)

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
				"flv",
				this.videoPlayerRef.current,
				stream.sources.flv,
				{
					onSourceEnd: this.onSourceEnd,
				},
			)
		}
	}

	componentWillUnmount = () => {
		if (this.state.player) {
			this.state.player.destroy()
		}

		if (typeof this.state.decoderInstance?.unload === "function") {
			this.state.decoderInstance.unload()
		}

		this.exitPlayerAnimation()

		this.toggleCinemaMode(false)

		if (this.streamInfoInterval) {
			clearInterval(this.streamInfoInterval)
		}
	}

	enterPlayerAnimation = () => {
		app.cores.style.applyTemporalVariant("dark")
		app.layout.toggleCompactMode(true)
		app.layout.toggleCenteredContent(false)
		app.controls.toggleUIVisibility(false)
	}

	exitPlayerAnimation = () => {
		app.cores.style.applyVariant(app.cores.style.currentVariantKey)
		app.layout.toggleCompactMode(false)
		app.layout.toggleCenteredContent(true)
		app.controls.toggleUIVisibility(true)
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

		this.setState({ cinemaMode: to })
	}

	render() {
		return (
			<div
				className={classnames("livestream", {
					["cinemaMode"]: this.state.cinemaMode,
				})}
			>
				{this.props.query.id}
				<div className="livestream_player">
					<div className="livestream_player_header">
						<div
							className="livestream_player_header_exit"
							onClick={() => app.location.back()}
						>
							<Icons.IoMdExit />
						</div>

						{this.state.stream ? (
							<>
								<div className="livestream_player_header_user">
									<UserPreview
										user={this.state.stream.user}
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
										<div className="livestream_player_header_info_title">
											<h1>
												{this.state.stream.info?.title}
											</h1>
										</div>
										<div className="livestream_player_header_info_description">
											<Marquee mode="smooth">
												{({ index }) => {
													return (
														<h4>
															{
																this.state
																	.stream.info
																	?.description
															}
														</h4>
													)
												}}
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
