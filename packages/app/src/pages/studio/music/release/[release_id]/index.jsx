import React from "react"
import * as antd from "antd"
import { Icons, createIconRender } from "@components/Icons"

import useUrlQueryActiveKey from "@hooks/useUrlQueryActiveKey"
import useReleaseEditor from "../../hooks/useReleaseEditor"

import Tabs from "./tabs"

import "./index.less"

const ReleaseEditor = (props) => {
	const { release_id } = props.params

	const {
		loading,
		loadError,

		submitting,
		submitError,

		data,
		changeData,

		submitRelease,
		deleteRelease,

		canSubmit,
		isNewRelease,
	} = useReleaseEditor(release_id)

	const [selectedTab, setSelectedTab] = useUrlQueryActiveKey({
		defaultKey: "info",
		queryKey: "tab",
	})

	const handleDelete = React.useCallback(() => {
		app.layout.modal.confirm({
			headerText: "Are you sure you want to delete this release?",
			descriptionText: "This action cannot be undone.",
			onConfirm: deleteRelease,
		})
	}, [deleteRelease])

	const renderContent = () => {
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

		if (!Tab) {
			return (
				<antd.Result
					status="error"
					title="Error"
					subTitle="Tab not found"
				/>
			)
		}

		return (
			<div className="music-studio-release-editor-content">
				{submitError && (
					<antd.Alert message={submitError.message} type="error" />
				)}
				{React.createElement(Tab.render, {
					data: data,
					changeData: changeData,
				})}
			</div>
		)
	}

	return (
		<div className="music-studio-release-editor">
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
						onClick={submitRelease}
						icon={
							isNewRelease ? <Icons.MdSend /> : <Icons.FiSave />
						}
						disabled={!canSubmit}
						loading={submitting}
					>
						{isNewRelease ? "Release" : "Save"}
					</antd.Button>

					{!isNewRelease && (
						<antd.Button
							icon={<Icons.IoMdTrash />}
							disabled={loading}
							onClick={handleDelete}
						>
							Delete
						</antd.Button>
					)}

					{!isNewRelease && (
						<antd.Button
							icon={<Icons.MdLink />}
							onClick={() =>
								app.location.push(`/music/list/${data._id}`)
							}
						>
							Go to release
						</antd.Button>
					)}
				</div>
			</div>

			{renderContent()}
		</div>
	)
}

ReleaseEditor.options = {
	layout: {
		type: "default",
		centeredContent: true,
	},
}

export default ReleaseEditor
