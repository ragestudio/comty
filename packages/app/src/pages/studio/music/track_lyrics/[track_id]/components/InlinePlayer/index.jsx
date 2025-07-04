import React from "react"
import PropTypes from "prop-types"
import { Button, Slider, Flex } from "antd"
import {
	PlayCircleOutlined,
	PauseCircleOutlined,
	SoundOutlined,
	LoadingOutlined,
} from "@ant-design/icons"

import { useAudioPlayer } from "../../hooks/useAudioPlayer"

import TimeIndicators from "../TimeIndicators"
import SeekBar from "../SeekBar"

const speedOptions = [
	{ label: "0.5x", value: 0.5 },
	{ label: "0.75x", value: 0.75 },
	{ label: "1x", value: 1 },
	{ label: "1.25x", value: 1.25 },
	{ label: "1.5x", value: 1.5 },
	{ label: "2x", value: 2 },
]

const InlinePlayer = React.forwardRef(({ src }, ref) => {
	const {
		audio,
		toggle,
		seek,
		setSpeed,
		setVolume,
		playbackSpeed,
		volume,
		isPlaying,
		isLoading,
	} = useAudioPlayer(src)

	React.useImperativeHandle(ref, () => {
		return {
			audio: audio,
			toggle: toggle,
			seek: seek,
			isPlaying: isPlaying,
		}
	})

	return (
		<div className="inline-player">
			<Flex horizontal align="center" justify="space-between">
				<Flex horizontal align="center" gap={20}>
					<Button
						type="primary"
						shape="circle"
						size="large"
						icon={
							isLoading ? (
								<LoadingOutlined spin />
							) : isPlaying ? (
								<PauseCircleOutlined />
							) : (
								<PlayCircleOutlined />
							)
						}
						onClick={toggle}
						disabled={isLoading}
						className="control-button play-button"
					/>

					<Flex horizontal align="center" gap={5}>
						<SoundOutlined />
						<Slider
							min={0}
							max={1}
							step={0.01}
							value={volume}
							onChange={setVolume}
							className="volume-slider"
							tooltip={{
								formatter: (value) =>
									`${Math.round(value * 100)}%`,
							}}
							icon={<SoundOutlined />}
							style={{ width: "100px" }}
						/>
					</Flex>
				</Flex>

				<code className="contime-display">
					<TimeIndicators audio={audio} />
				</code>
			</Flex>

			<Flex vertical gap={10}>
				<SeekBar audio={audio} onSeek={seek} />

				<div className="speed-controls">
					{speedOptions.map((option) => (
						<Button
							key={option.value}
							type={
								playbackSpeed === option.value
									? "primary"
									: "default"
							}
							size="small"
							onClick={() => setSpeed(option.value)}
							className="speed-button"
						>
							{option.label}
						</Button>
					))}
				</div>
			</Flex>
		</div>
	)
})

InlinePlayer.displayName = "InlinePlayer"

InlinePlayer.propTypes = {
	src: PropTypes.string.isRequired,
}

export default InlinePlayer
