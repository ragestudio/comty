import React from "react"
import * as antd from "antd"
import { Icons, createIconRender } from "@components/Icons"

import MusicModel from "@models/music"
import compareObjectsByProperties from "@utils/compareObjectsByProperties"
import useUrlQueryActiveKey from "@hooks/useUrlQueryActiveKey"

import TrackManifest from "@cores/player/classes/TrackManifest"

import {
	DefaultReleaseEditorState,
	ReleaseEditorStateContext,
} from "@contexts/MusicReleaseEditor"

import Tabs from "./tabs"

import "./index.less"

const ReleaseEditor = (props) => {
	const { release_id } = props

	const basicInfoRef = React.useRef()

	const [submitting, setSubmitting] = React.useState(false)
	const [loading, setLoading] = React.useState(true)
	const [submitError, setSubmitError] = React.useState(null)

	const [loadError, setLoadError] = React.useState(null)
	const [globalState, setGlobalState] = React.useState(
		DefaultReleaseEditorState,
	)
	const [initialValues, setInitialValues] = React.useState({})

	const [customPage, setCustomPage] = React.useState(null)
	const [customPageActions, setCustomPageActions] = React.useState([])

	const [selectedTab, setSelectedTab] = useUrlQueryActiveKey({
		defaultKey: "info",
		queryKey: "tab",
	})

	async function initialize() {
		setLoading(true)
		setLoadError(null)

		if (release_id !== "new") {
			try {
				let releaseData = await MusicModel.getReleaseData(release_id)

				if (Array.isArray(releaseData.items)) {
					releaseData.items = releaseData.items.map((item) => {
						return new TrackManifest(item)
					})
				}

				setGlobalState({
					...globalState,
					...releaseData,
				})

				setInitialValues(releaseData)
			} catch (error) {
				setLoadError(error)
			}
		}

		setLoading(false)
	}

	function hasChanges() {
		const stagedChanges = {
			title: globalState.title,
			type: globalState.type,
			public: globalState.public,
			cover: globalState.cover,
			items: globalState.items,
		}

		return !compareObjectsByProperties(
			stagedChanges,
			initialValues,
			Object.keys(stagedChanges),
		)
	}

	async function renderCustomPage(page, actions) {
		setCustomPage(page ?? null)
		setCustomPageActions(actions ?? [])
	}

	async function handleSubmit() {
		setSubmitting(true)
		setSubmitError(null)

		try {
			console.log("Submitting Tracks")

			// first sumbit tracks
			const tracks = await MusicModel.putTrack({
				items: globalState.items,
			})

			console.log("Submitting release")

			// then submit release
			const result = await MusicModel.putRelease({
				_id: globalState._id,
				title: globalState.title,
				description: globalState.description,
				public: globalState.public,
				cover: globalState.cover,
				explicit: globalState.explicit,
				type: globalState.type,
				items: tracks.items.map((item) => item._id),
			})

			app.location.push(`/studio/music/${result._id}`)
		} catch (error) {
			console.error(error)
			app.message.error(error.message)

			setSubmitError(error)
			setSubmitting(false)

			return false
		}

		setSubmitting(false)
		app.message.success("Release saved")
	}

	async function handleDelete() {
		app.layout.modal.confirm({
			headerText: "Are you sure you want to delete this release?",
			descriptionText: "This action cannot be undone.",
			onConfirm: async () => {
				await MusicModel.deleteRelease(globalState._id)
				app.location.push(
					window.location.pathname.split("/").slice(0, -1).join("/"),
				)
			},
		})
	}

	function canFinish() {
		return hasChanges()
	}

	React.useEffect(() => {
		initialize()
	}, [])

	if (loadError) {
		return (
			<antd.Result
				status="warning"
				title="Error"
				subTitle={loadError.message}
			/>
		)
	}

	if (loading) {
		return <antd.Skeleton active />
	}

	const Tab = Tabs.find(({ key }) => key === selectedTab)

	const CustomPageProps = {
		close: () => {
			renderCustomPage(null, null)
		},
	}

	return (
		<ReleaseEditorStateContext.Provider
			value={{
				...globalState,
				setGlobalState,
				renderCustomPage,
				setCustomPageActions,
			}}
		>
			<div className="music-studio-release-editor">
				{customPage && (
					<div className="music-studio-release-editor-custom-page">
						{customPage.header && (
							<div className="music-studio-release-editor-custom-page-header">
								<div className="music-studio-release-editor-custom-page-header-title">
									<antd.Button
										icon={<Icons.IoIosArrowBack />}
										onClick={() =>
											renderCustomPage(null, null)
										}
									/>

									<h2>{customPage.header}</h2>
								</div>

								{Array.isArray(customPageActions) &&
									customPageActions.map((action, index) => {
										return (
											<antd.Button
												key={index}
												type={action.type}
												icon={createIconRender(
													action.icon,
												)}
												onClick={async () => {
													if (
														typeof action.onClick ===
														"function"
													) {
														await action.onClick()
													}

													if (action.fireEvent) {
														app.eventBus.emit(
															action.fireEvent,
														)
													}
												}}
												disabled={action.disabled}
											>
												{action.label}
											</antd.Button>
										)
									})}
							</div>
						)}

						{customPage.content &&
							(React.isValidElement(customPage.content)
								? React.cloneElement(customPage.content, {
										...CustomPageProps,
										...customPage.props,
									})
								: React.createElement(customPage.content, {
										...CustomPageProps,
										...customPage.props,
									}))}
					</div>
				)}
				{!customPage && (
					<>
						<div className="music-studio-release-editor-menu">
							<antd.Menu
								onClick={(e) => setSelectedTab(e.key)}
								selectedKeys={[selectedTab]}
								items={Tabs}
								mode="vertical"
							/>

							<div className="music-studio-release-editor-menu-actions">
								<antd.Button
									type="primary"
									onClick={handleSubmit}
									icon={
										release_id !== "new" ? (
											<Icons.FiSave />
										) : (
											<Icons.MdSend />
										)
									}
									disabled={
										submitting || loading || !canFinish()
									}
									loading={submitting}
								>
									{release_id !== "new" ? "Save" : "Release"}
								</antd.Button>

								{release_id !== "new" ? (
									<antd.Button
										icon={<Icons.IoMdTrash />}
										disabled={loading}
										onClick={handleDelete}
									>
										Delete
									</antd.Button>
								) : null}

								{release_id !== "new" ? (
									<antd.Button
										icon={<Icons.MdLink />}
										onClick={() =>
											app.location.push(
												`/music/list/${globalState._id}`,
											)
										}
									>
										Go to release
									</antd.Button>
								) : null}
							</div>
						</div>

						<div className="music-studio-release-editor-content">
							{submitError && (
								<antd.Alert
									message={submitError.message}
									type="error"
								/>
							)}
							{!Tab && (
								<antd.Result
									status="error"
									title="Error"
									subTitle="Tab not found"
								/>
							)}
							{Tab &&
								React.createElement(Tab.render, {
									release: globalState,

									state: globalState,
									setState: setGlobalState,

									references: {
										basic: basicInfoRef,
									},
								})}
						</div>
					</>
				)}
			</div>
		</ReleaseEditorStateContext.Provider>
	)
}

export default ReleaseEditor
