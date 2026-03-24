import React from "react"
import { Input, Select } from "antd"

import Button from "@ui/Button"
import Icons from "@components/Icons"
import UploadButton from "@components/UploadButton"

import GroupModel from "@models/groups"

import "./index.less"

const CreateGroupPage = () => {
	const [submitting, setSubmitting] = React.useState(false)
	const [submitError, setSubmitError] = React.useState(null)

	const defaultGroupName = React.useMemo(
		() => `${app.userData.username} group`,
		[],
	)

	const [obj, setObj] = React.useState({
		name: defaultGroupName,
		visibility: "private",
	})

	const updateField = (field, value) => {
		setObj({ ...obj, [field]: value })
	}

	const submit = React.useCallback(async () => {
		setSubmitting(true)
		setSubmitError(null)

		try {
			const result = await GroupModel.create(obj)

			console.debug(result)
			app.message.success("Group created successfully")
			app.navigation.goToGroup(result._id)
		} catch (e) {
			setSubmitError(e)
		} finally {
			setSubmitting(false)
		}
	}, [obj])

	return (
		<div className="spaces-create_new">
			<div className="spaces-create_new__header">
				<h1>Create new Group</h1>
				{/* <p>Text sample</p>*/}
			</div>

			<div className="spaces-create_new__form">
				<div className="spaces-create_new__form__preview">
					<div className="spaces-create_new__form__preview__icon bg-accent">
						{obj.icon ? (
							<img src={obj.icon} />
						) : (
							<Icons.Birdhouse />
						)}
					</div>

					<div className="spaces-create_new__form__preview__content">
						<h1>{obj.name}</h1>
						{obj.description && <p>{obj.description}</p>}
					</div>
				</div>

				<div className="spaces-create_new__form__fields">
					<div className="spaces-create_new__form__fields__field">
						<h3>Icon</h3>

						<UploadButton
							onUpdate={(icon) => updateField("icon", icon)}
							disabled={submitting}
						/>
					</div>

					<div className="spaces-create_new__form__fields__field">
						<h3>Name</h3>

						<Input
							placeholder="My new awesome group"
							onChange={(e) => {
								e.target.value = e.target.value.trim()

								if (e.target.value.length === 0) {
									return updateField("name", defaultGroupName)
								}

								updateField("name", e.target.value)
							}}
							disabled={submitting}
						/>
					</div>

					<div className="spaces-create_new__form__fields__field">
						<h3>Description</h3>

						<Input
							placeholder="A short description of the group"
							onChange={(e) => {
								e.target.value = e.target.value.trim()

								if (e.target.value.length === 0) {
									return updateField("description", null)
								}

								updateField("description", e.target.value)
							}}
							disabled={submitting}
						/>
					</div>

					<div className="spaces-create_new__form__fields__field">
						<h3>Visibility</h3>

						<Select
							placeholder="Select a visibility"
							defaultValue="private"
							options={[
								{ value: "public", label: "Public" },
								{ value: "private", label: "Private" },
							]}
							disabled
						/>
					</div>
				</div>
			</div>

			<div className="spaces-create_new__actions">
				<Button
					disabled={submitting}
					loading={submitting}
					onClick={submit}
				>
					Create
				</Button>
			</div>

			{submitError && (
				<div className="spaces-create_new__error">
					<code>{submitError.message}</code>
				</div>
			)}
		</div>
	)
}

CreateGroupPage.options = {
	layout: {
		centeredContent: true,
	},
}

export default CreateGroupPage
