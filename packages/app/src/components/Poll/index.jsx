import React from "react"
import * as antd from "antd"
import classnames from "classnames"
import { Icons, createIconRender } from "@components/Icons"
import { motion } from "motion/react"

import useWsEvents from "@hooks/useWsEvents"

import PostModel from "@models/post"

import "./index.less"

const PollOption = (props) => {
	async function onClick() {
		if (typeof props.onClick === "function") {
			await props.onClick(props.option.id)
		}
	}

	return (
		<div
			className={classnames("poll-option", {
				["checked"]: props.checked,
			})}
			style={{
				"--percentage": `${props.percentage}%`,
			}}
			onClick={onClick}
		>
			{props.checked && (
				<motion.div
					className="percentage-indicator"
					animate={{ width: `${props.percentage}%` }}
					initial={{ width: 0 }}
					transition={{ ease: "easeOut" }}
				/>
			)}

			<div className="poll-option-content">
				{props.checked && createIconRender("FaCheck")}

				{props.showPercentage && (
					<span>{Math.floor(props.percentage)}%</span>
				)}

				<span>{props.option.label}</span>
			</div>
		</div>
	)
}

const Poll = (props) => {
	const { editMode, onClose, formRef } = props

	const [options, setOptions] = React.useState(props.options ?? [])
	const [hasVoted, setHasVoted] = React.useState(false)
	const [totalVotes, setTotalVotes] = React.useState(0)

	useWsEvents(
		{
			"post.poll.vote": (data) => {
				const { post_id, option_id, user_id, previous_option_id } = data

				if (post_id !== props.post_id) {
					return false
				}

				console.debug(`U[${user_id}] vote to option [${option_id}]`)

				setOptions((prev) => {
					prev = prev.map((option) => {
						return option
					})

					if (user_id === app.userData._id) {
						// remove all `voted` properties
						prev = prev.map((option) => {
							delete option.voted

							option.voted = option.id === option_id

							return option
						})
					}

					if (previous_option_id) {
						const previousOptionIndex = prev.findIndex(
							(option) => option.id === previous_option_id,
						)

						if (previousOptionIndex !== -1) {
							prev[previousOptionIndex].count =
								prev[previousOptionIndex].count - 1
						}
					}

					if (option_id) {
						const newOptionIndex = prev.findIndex(
							(option) => option.id === option_id,
						)

						if (newOptionIndex !== -1) {
							prev[newOptionIndex].count += 1
						}
					}

					return prev
				})
			},
		},
		{
			socketName: "posts",
		},
	)

	async function onVote(id) {
		console.debug(`Voting poll option`, {
			option_id: id,
			post_id: props.post_id,
		})

		await PostModel.votePoll({
			post_id: props.post_id,
			option_id: id,
		})
	}

	React.useEffect(() => {
		if (options) {
			const totalVotes = options.reduce((sum, option) => {
				return sum + option.count
			}, 0)

			setTotalVotes(totalVotes)

			const hasVoted = options.some((option) => {
				return option.voted
			})

			setHasVoted(hasVoted)
		}
	}, [options])

	return (
		<div className="poll">
			{!editMode &&
				options.map((option, index) => {
					const percentage =
						totalVotes > 0 ? (option.count / totalVotes) * 100 : 0

					return (
						<PollOption
							key={index}
							option={option}
							onClick={onVote}
							checked={option.voted}
							percentage={percentage}
							showPercentage={hasVoted}
						/>
					)
				})}

			{editMode && (
				<antd.Form
					name="post-poll"
					className="post-poll-edit"
					ref={formRef}
					initialValues={{
						options: options,
					}}
				>
					<antd.Form.List name="options">
						{(fields, { add, remove }) => {
							return (
								<>
									{fields.map((field, index) => {
										return (
											<div
												key={field.key}
												className="post-poll-edit-option"
											>
												<antd.Form.Item
													{...field}
													name={[field.name, "label"]}
												>
													<antd.Input placeholder="Type a option" />
												</antd.Form.Item>

												{fields.length > 1 && (
													<antd.Button
														onClick={() =>
															remove(field.name)
														}
														icon={createIconRender(
															"MdRemove",
														)}
													/>
												)}
											</div>
										)
									})}

									<antd.Button
										onClick={() => add()}
										icon={createIconRender("PlusOutlined")}
									>
										Add Option
									</antd.Button>
								</>
							)
						}}
					</antd.Form.List>
				</antd.Form>
			)}

			{editMode && (
				<div className="poll-edit-actions">
					<antd.Button
						onClick={onClose}
						icon={createIconRender("CloseOutlined")}
						size="small"
						type="text"
					/>
				</div>
			)}
		</div>
	)
}

export default Poll
