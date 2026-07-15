import React, { useState, useEffect, useCallback, useRef } from "react"
import { Tabs, Badge, Tag } from "antd"

import StatusOverview from "./panels/StatusOverview"
import TransportsPanel from "./panels/TransportsPanel"
import ProducersPanel from "./panels/ProducersPanel"
import ConsumersPanel from "./panels/ConsumersPanel"
import ClientsPanel from "./panels/ClientsPanel"
import ScreensPanel from "./panels/ScreensPanel"
import AudioPipeline from "./panels/AudioPipeline"
import EventLog from "./panels/EventLog"
import ActionsPanel from "./panels/ActionsPanel"

import "./debug.less"

const EVENT_LOG_LIMIT = 200

export default function DebugWindow() {
	const [rtcCore, setRtcCore] = useState(null)
	const [state, setState] = useState({})
	const [eventLog, setEventLog] = useState([])
	const [producers, setProducers] = useState([])
	const [consumers, setConsumers] = useState([])
	const [clients, setClients] = useState([])
	const [screens, setScreens] = useState([])
	const [refreshKey, setRefreshKey] = useState(0)

	const pollInterval = useRef(null)

	const addLogEvent = useCallback((type, data) => {
		setEventLog((prev) => {
			const entry = {
				id: Date.now() + Math.random(),
				type,
				timestamp: new Date(),
				data,
			}
			const next = [entry, ...prev]
			if (next.length > EVENT_LOG_LIMIT) {
				next.length = EVENT_LOG_LIMIT
			}
			return next
		})
	}, [])

	useEffect(() => {
		if (!app?.cores?.mediartc) {
			return
		}

		const core = app.cores.mediartc.instance()
		setRtcCore(core)

		const refreshData = () => {
			const s = app.cores.mediartc.state()
			setState({ ...s })

			const p = Array.from(core.producers.values()).map((p) => ({
				id: p.id,
				producerId: p.producerId,
				kind: p.kind,
				type: p.type,
				paused: p.paused,
				closed: p.closed,
				self: p.self,
				remote: p.remote,
				userId: p.userId,
				appData: p.appData,
				track: p.track
					? {
							kind: p.track.kind,
							readyState: p.track.readyState,
							enabled: p.track.enabled,
							muted: p.track.muted,
							label: p.track.label,
							id: p.track.id,
						}
					: null,
				rtpParameters: p.rtpParameters
					? {
							codecs: p.rtpParameters.codecs?.map((c) => ({
								mimeType: c.mimeType,
								clockRate: c.clockRate,
								channels: c.channels,
							})),
						}
					: null,
			}))
			setProducers(p)

			const c = Array.from(core.consumers.values()).map((c) => ({
				id: c.id,
				producerId: c.producerId,
				kind: c.kind,
				type: c.type,
				paused: c.paused,
				closed: c.closed,
				userId: c.userId,
				appData: c.appData,
				isSpeaking: c.isSpeaking,
				track: c.track
					? {
							kind: c.track.kind,
							readyState: c.track.readyState,
							enabled: c.track.enabled,
							muted: c.track.muted,
							label: c.track.label,
							id: c.track.id,
						}
					: null,
			}))
			setConsumers(c)

			const cl = s.clients || []
			setClients(cl)

			const sc = Array.from(core.screens.values()).map((sc) => ({
				userId: sc.producer?.userId,
				consumersIds: sc.consumersIds,
				mediaTracks: sc.media
					? Array.from(sc.media.getTracks()).map((t) => ({
							kind: t.kind,
							readyState: t.readyState,
							enabled: t.enabled,
							label: t.label,
						}))
					: [],
			}))
			setScreens(sc)

			setRefreshKey((k) => k + 1)
		}

		// Capture any emit to log events
		const originalEmit = app.eventBus?.emit
		if (app.eventBus) {
			app.eventBus.emit = function (event, ...args) {
				if (
					event &&
					event.startsWith &&
					event.startsWith("mediartc:")
				) {
					addLogEvent("eventBus:" + event, args[0])
				}
				return originalEmit?.call?.(this, event, ...args)
			}
		}

		// Also intercept the socket events if possible
		const socket = core.socket
		if (socket) {
			const originalOn = socket.on
			// We can't easily intercept already-registered handlers, but we can listen for state changes
		}

		// Subscribe to state changes
		const stateHandler = (newState) => {
			addLogEvent("state:change", newState)
			setState({ ...newState })
		}
		app.eventBus?.on?.("mediartc:state:change", stateHandler)

		// Initial load
		refreshData()

		// Poll for non-observable data
		pollInterval.current = setInterval(refreshData, 1000)

		return () => {
			app.eventBus?.off?.("mediartc:state:change", stateHandler)
			clearInterval(pollInterval.current)
		}
	}, [addLogEvent])

	const activePanelsCount = [
		state.isJoined,
		producers.length > 0,
		consumers.length > 0,
		clients.length > 0,
		screens.length > 0,
	].filter(Boolean).length

	const tabItems = [
		{
			key: "overview",
			label: (
				<span>
					Overview{" "}
					<Badge
						count={state.isJoined ? "ON" : "OFF"}
						style={{
							backgroundColor: state.isJoined
								? "var(--debug-active)"
								: "var(--debug-inactive)",
						}}
					/>
				</span>
			),
			children: (
				<StatusOverview
					state={state}
					core={rtcCore}
				/>
			),
		},
		{
			key: "transports",
			label: (
				<span>
					Transports{" "}
					<Tag
						color={
							state.sendTransportState === "connected"
								? "green"
								: "red"
						}
					>
						S
					</Tag>
					<Tag
						color={
							state.recvTransportState === "connected"
								? "green"
								: "red"
						}
					>
						R
					</Tag>
				</span>
			),
			children: (
				<TransportsPanel
					state={state}
					core={rtcCore}
				/>
			),
		},
		{
			key: "producers",
			label: `Producers (${producers.length})`,
			children: (
				<ProducersPanel
					producers={producers}
					core={rtcCore}
				/>
			),
		},
		{
			key: "consumers",
			label: `Consumers (${consumers.length})`,
			children: (
				<ConsumersPanel
					consumers={consumers}
					state={state}
				/>
			),
		},
		{
			key: "clients",
			label: `Clients (${clients.length})`,
			children: (
				<ClientsPanel
					clients={clients}
					core={rtcCore}
					consumers={consumers}
				/>
			),
		},
		{
			key: "screens",
			label: `Screens (${screens.length})`,
			children: <ScreensPanel screens={screens} />,
		},
		{
			key: "audio",
			label: "Audio Pipeline",
			children: <AudioPipeline core={rtcCore} />,
		},
		{
			key: "events",
			label: `Events (${eventLog.length})`,
			children: <EventLog events={eventLog} />,
		},
		{
			key: "actions",
			label: "Actions",
			children: (
				<ActionsPanel
					core={rtcCore}
					state={state}
					addLogEvent={addLogEvent}
				/>
			),
		},
	]

	return (
		<div
			className="mediartc-debug-window"
			style={{ padding: 8 }}
		>
			<div
				className="debug-header"
				style={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					marginBottom: 8,
				}}
			>
				<h3 style={{ margin: 0 }}>MediaRTC Debug Console</h3>
			</div>
			<Tabs
				defaultActiveKey="overview"
				items={tabItems}
				size="small"
				tabBarStyle={{ marginBottom: 8 }}
			/>
		</div>
	)
}
