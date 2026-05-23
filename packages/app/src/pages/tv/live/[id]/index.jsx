import React from "react"
import Plyr from "plyr"
import * as antd from "antd"
import Marquee from "react-fast-marquee"
import classnames from "classnames"

import UserPreview from "@components/UserPreview"
import { Icons } from "@components/Icons"

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

	return stream
}

const StreamViewer = ({ params }) => {
	const [data, setData] = React.useState(null)
	const [loading, setLoading] = React.useState(true)
	const [isEnded, setIsEnded] = React.useState(false)
	const [spectators, setSpectators] = React.useState(0)

	const decoderRef = React.useRef(null)
	const playerRef = React.useRef(null)
	const videoRef = React.useRef(null)
	const syncInterval = React.useRef(null)

	const loadDecoder = async (decoder, ...args) => {
		if (typeof Decoders[decoder] === "undefined") {
			console.error("[TV] Protocol not supported")
			return false
		}

		if (decoderRef.current) {
			if (typeof decoderRef.current.destroy === "function") {
				decoderRef.current.destroy()
			}

			decoderRef.current = null
		}

		decoderRef.current = Decoders[decoder](...args)
	}

	const loadStream = async (stream_id) => {
		if (!playerRef.current) return
		if (!videoRef.current) return

		setLoading(true)
		setIsEnded(false)

		const stream = await fetchStream(stream_id)

		console.log(`[TV] Stream data >`, stream)

		setLoading(false)
		setIsEnded(!stream || !stream?.available)
		setData(stream)

		if (stream) {
			setSpectators(stream.viewers)

			if (stream.info?.available) {
				playerRef.current.poster = stream.info?.thumbnail
			} else {
				playerRef.current.poster = stream.info?.offline_thumbnail
			}

			if (stream.available) {
				await loadDecoder(
					StreamViewer.defaultDecoder,
					videoRef.current,
					stream.urls,
					{
						onSourceEnd: () => {
							setIsEnded(true)
						},
					},
				)
			}
		}
	}

	const syncData = async (stream_id) => {
		const stream = await fetchStream(stream_id)
		const streamIsEnded = !stream || !stream?.available

		setIsEnded(streamIsEnded)

		if (stream) {
			setData(stream)
			setSpectators(stream.viewers)

			if (!streamIsEnded && !decoderRef.current) {
				loadStream(stream_id)
			}
		}
	}

	React.useEffect(() => {
		playerRef.current = new Plyr(videoRef.current, {
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

		playerRef.current.muted = true

		loadStream(params.id)

		syncInterval.current = setInterval(() => {
			syncData(params.id)
		}, StreamViewer.stateSyncMs)

		return () => {
			if (decoderRef.current) {
				if (typeof decoderRef.current.unload === "function") {
					decoderRef.current.unload()
				}

				if (typeof decoderRef.current.destroy === "function") {
					decoderRef.current.destroy()
				}

				decoderRef.current = null
			}

			if (syncInterval.current) {
				clearInterval(syncInterval.current)
				syncInterval.current = null
			}
		}
	}, [params.id])

	return (
		<div
			className={classnames("livestream", {
				["isEnded"]: isEnded,
			})}
		>
			<div className="livestream_player">
				<div className="livestream_player_header">
					{(!data || loading) && <antd.Skeleton active />}
					{data && (
						<>
							<div className="livestream_player_header_user">
								<UserPreview
									user_id={data.user_id}
									onlyIcon
								/>

								<div className="livestream_player_indicators">
									{!isEnded && (
										<div className="livestream_player_header_user_spectators">
											<antd.Tag icon={<Icons.Eye />}>
												{spectators}
											</antd.Tag>
										</div>
									)}
								</div>
							</div>

							{data.info && (
								<div className="livestream_player_header_info">
									<div className="livestream_player_header_title">
										<h1>{data.info?.title}</h1>
									</div>
									<div className="livestream_player_header_description">
										<Marquee mode="smooth">
											<h4>{data.info?.description}</h4>
										</Marquee>
									</div>
								</div>
							)}
						</>
					)}
				</div>

				<video
					id="player"
					ref={videoRef}
					playsinline
				/>

				{isEnded && (
					<div className="ended_banner">
						<antd.Result>
							<h1>This stream is ended</h1>
						</antd.Result>
					</div>
				)}

				<div
					className={classnames("livestream_player_loading", {
						["active"]: loading,
					})}
				>
					<antd.Spin />
				</div>
			</div>
		</div>
	)
}

StreamViewer.defaultDecoder = "hls"
StreamViewer.stateSyncMs = 15000 // 15 seconds
StreamViewer.options = {
	layout: {
		centeredContent: false,
		maxHeight: true,
	},
}

export default StreamViewer
