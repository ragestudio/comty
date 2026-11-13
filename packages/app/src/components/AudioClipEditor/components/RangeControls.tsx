import React from "react"

import { formatTime } from "../utils"
import { b } from "../style"

export type RangeControlsProps = {
	duration: number
	start: number
	end: number
	maxDuration: number
	onStartChange: (event: React.ChangeEvent<HTMLInputElement>) => void
	onEndChange: (event: React.ChangeEvent<HTMLInputElement>) => void
}

const RangeControls = ({
	duration,
	start,
	end,
	maxDuration,
	onStartChange,
	onEndChange,
}: RangeControlsProps) => {
	return (
		<>
			<div className={b.elem("ranges")}>
				<label className={b.elem("range")}>
					<span>Start</span>
					<input
						type="range"
						min={0}
						max={duration}
						step={0.01}
						value={start}
						onChange={onStartChange}
					/>
					<strong>{formatTime(start)}</strong>
				</label>

				<label className={b.elem("range")}>
					<span>End</span>
					<input
						type="range"
						min={0}
						max={duration}
						step={0.01}
						value={end}
						onChange={onEndChange}
					/>
					<strong>{formatTime(end)}</strong>
				</label>
			</div>

			<div className={b.elem("info")}>
				<span>Selected: {formatTime(end - start)}</span>

				{Number.isFinite(maxDuration) && (
					<span>Max: {formatTime(maxDuration)}</span>
				)}
			</div>
		</>
	)
}

export default RangeControls
