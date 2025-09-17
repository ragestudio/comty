import React from "react"
import Plyr from "plyr"
import * as antd from "antd"
import Marquee from "react-fast-marquee"
import classnames from "classnames"

import UserPreview from "@components/UserPreview"
import { Icons } from "@components/Icons"

import LiveChat from "@components/LiveChat"
import SpectrumModel from "@models/spectrum"

import * as Decoders from "./decoders"

import "plyr/dist/plyr.css"
import "./index.less"

async function fetchStream(stream_id) {
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

	if (!stream.sources || !stream.sources.hls) {
		return false
	}

	return stream
}

export default class StreamViewer extends React.Component {
	static defaultDecoder = "hls"
	static stateSyncMs = 1 * 60 * 1000 // 1 minute

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
		if (typeof Decoders[decoder] === "undefined") {
			console.error("[TV] Protocol not supported")
			return false
		}

		console.log(`[TV] Switching decoder to: ${decoder}`)

		await this.toggleLoading(true)

		// check if decoder is already loaded
		if (this.state.decoderInstance) {
			if (typeof this.state.decoderInstance.destroy === "function") {
				this.state.decoderInstance.destroy()
			}

			this.setState({ decoderInstance: null })
		}

		const decoderInstance = await Decoders[decoder](...args)

		await this.setState({
			decoderInstance: decoderInstance,
		})

		await this.toggleLoading(false)

		return decoderInstance
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

	joinStreamWebsocket = async (stream) => {
		if (!stream) {
			console.error(
				`[TV] Cannot connect to stream websocket if no stream provided`,
			)
			return false
		}

		const client = await SpectrumModel.createStreamWebsocket(stream._id, {
			maxConnectRetries: 3,
			refName: "/",
		})

		this.setState({
			websocket: client,
		})

		await client.connect()

		this.streamStateInterval = setInterval(() => {
			this.syncWithStreamState()
		}, StreamViewer.stateSyncMs)

		setTimeout(this.syncWithStreamState, 1000)

		return client
	}

	syncWithStreamState = async () => {
		if (!this.state.websocket || !this.state.stream) {
			return false
		}

		const state = await this.state.websocket.requestState()

		return this.setState({
			spectators: state.viewers,
			stream: {
				...this.state.stream,
				...(state.profile ?? {}),
			},
		})
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

	setStreamLevel = (level) => {}

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

	componentDidMount = async () => {
		this.enterPlayerAnimation()
		this.attachPlayer()

		// fetch stream data
		const stream = await fetchStream(this.props.params.id)

		// and error occurred or no stream available/online
		if (!stream) {
			return this.onSourceEnd()
		}

		console.log(`[TV] Stream data >`, stream)

		// set data
		this.setState({
			stream: stream,
			spectators: stream.viewers,
		})

		try {
			// joinStreamWebsocket
			this.joinStreamWebsocket(stream)
		} catch (error) {
			console.error(error)
		}

		// load decoder with provided data
		await this.loadDecoder(
			StreamViewer.defaultDecoder,
			this.videoPlayerRef.current,
			stream.sources,
			{
				onSourceEnd: this.onSourceEnd,
				authToken: this.props.query["token"],
			},
		)
	}

	componentWillUnmount = () => {
		if (typeof this.state.decoderInstance?.unload === "function") {
			this.state.decoderInstance.unload()
		}

		if (typeof this.state.decoderInstance?.destroy === "function") {
			this.state.decoderInstance.destroy()
		}

		if (typeof this.state.decoderInstance?._destroy === "function") {
			this.state.decoderInstance._destroy()
		}

		if (this.state.websocket) {
			if (typeof this.state.websocket.destroy === "function") {
				this.state.websocket.destroy()
			}
		}

		this.exitPlayerAnimation()
		this.toggleCinemaMode(false)

		if (this.streamStateInterval) {
			clearInterval(this.streamStateInterval)
		}
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
												<antd.Tag icon={<Icons.Eye />}>
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
									<Icons.MessageSquare /> Live chat
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
