import React from "react"
import { Button } from "antd"
import { ActionsBar } from "components"
import { Icons, createIconRender } from "components/icons"
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd"

import Selector from "../selector"

import sidebarItems from "schemas/routes.json"
import defaultSidebarKeys from "schemas/defaultSidebar.json"

import "./index.less"

const allItemsMap = [...sidebarItems].map((item, index) => {
	item.key = index.toString()
	item.index = index
	return item
})

const getAllItems = () => {
	let items = {}

	allItemsMap.forEach((item) => {
		items[item.id] = {
			...item,
			content: (
				<>
					{createIconRender(item.icon)} {item.title}
				</>
			),
		}
	})

	return items
}

const allItems = getAllItems()

export default class SidebarEditor extends React.Component {
	state = {
		items: [],
		lockedIndex: [],
	}

	componentDidMount() {
		this.loadItems()
	}

	loadItems = () => {
		const storagedKeys = window.app.configuration.sidebar.get() ?? defaultSidebarKeys
		const active = []
		const lockedIndex = []

		// set current active items
		storagedKeys.forEach((key) => {
			if (typeof allItems[key] !== "undefined") {
				if (allItems[key].locked) {
					lockedIndex.push(allItems[key].index)
				}
				active.push(key)
			}
		})

		this.setState({ items: active, lockedIndex })
	}

	onSave = () => {
		window.app.configuration.sidebar._push(this.state.items)
		window.app.SidebarController.toogleEdit(false)
	}

	onDiscard = () => {
		window.app.SidebarController.toogleEdit(false)
	}

	onSetDefaults = () => {
		window.app.configuration.sidebar._push(defaultSidebarKeys)
		this.loadItems()
	}

	reorder = (list, startIndex, endIndex) => {
		const result = Array.from(list)
		const [removed] = result.splice(startIndex, 1)
		result.splice(endIndex, 0, removed)

		return result
	}

	onDragEnd = (result) => {
		if (!result.destination) {
			return false
		}

		if (this.state.lockedIndex.includes(result.destination.index)) {
			return false
		}

		if (allItems[result.draggableId].locked) {
			console.warn("Cannot move an locked item")
			return false
		}

		const items = this.reorder(this.state.items, result.source.index, result.destination.index)

		this.setState({ items })
	}

	deleteItem = (key) => {
		this.setState({ items: this.state.items.filter((item) => item !== key) })
	}

	addItem = () => {
		const keys = []

		// filter by active keys
		allItemsMap.forEach((item) => {
			if (!this.state.items.includes(item.id)) {
				keys.push(item.id)
			}
		})

		window.app.DrawerController.open("sidebar_item_selector", Selector, {
			props: {
				width: "65%",
			},
			componentProps: {
				items: keys
			},
			onDone: (drawer, selectedKeys) => {
				drawer.close()

				if (Array.isArray(selectedKeys)) {
					const update = this.state.items ?? []

					selectedKeys.forEach((key) => {
						if (update.includes(key)) {
							return false
						}
						
						update.push(key)
					})

					this.setState({ items: update })
				}
			},
		})
	}

	render() {
		const grid = 6

		const getItemStyle = (isDragging, draggableStyle, component, isDraggingOver) => ({
			cursor: component.locked ? "not-allowed" : "grab",
			userSelect: "none",
			padding: grid * 2,
			margin: `0 0 ${grid}px 0`,
			borderRadius: "6px",
			transition: "150ms all ease-in-out",
			width: "100%",

			border: isDraggingOver ? "2px dashed #e0e0e0" : "none",

			color: component.locked ? "rgba(145,145,145,0.6)" : "#000",
			background: component.locked
				? "rgba(145, 145, 145, 0.2)"
				: isDragging
				? "rgba(145, 145, 145, 0.5)"
				: "transparent",
			...draggableStyle,
		})

		const getListStyle = (isDraggingOver) => ({
			background: "transparent",
			transition: "150ms all ease-in-out",

			padding: grid,
			width: "100%",
		})

		return (
			<div>
				<DragDropContext onDragEnd={this.onDragEnd}>
					<Droppable droppableId="droppable">
						{(droppableProvided, droppableSnapshot) => (
							<div
								ref={droppableProvided.innerRef}
								style={getListStyle(droppableSnapshot.isDraggingOver)}
							>
								{this.state.items.map((key, index) => {
									const itemComponent = allItems[key]

									return (
										<Draggable
											isDragDisabled={itemComponent.locked}
											key={key}
											draggableId={key}
											index={index}
										>
											{(draggableProvided, draggableSnapshot) => (
												<div
													ref={draggableProvided.innerRef}
													{...draggableProvided.draggableProps}
													{...draggableProvided.dragHandleProps}
													style={getItemStyle(
														draggableSnapshot.isDragging,
														draggableProvided.draggableProps.style,
														itemComponent,
														droppableSnapshot.isDraggingOver,
													)}
												>
													<Icons.Trash
														onClick={() => this.deleteItem(key)}
														className="sidebar_editor_deleteBtn"
													/>
													{itemComponent.title ?? itemComponent.id}
												</div>
											)}
										</Draggable>
									)
								})}
								{droppableProvided.placeholder}
							</div>
						)}
					</Droppable>
				</DragDropContext>

				<ActionsBar
					style={{ position: "absolute", bottom: 0, left: 0, width: "100%", borderRadius: "12px 12px 0 0" }}
				>
					<div>
						<Button
							style={{ lineHeight: 0 }}
							icon={<Icons.Plus style={{ margin: 0, padding: 0 }} />}
							onClick={this.addItem}
						/>
					</div>
					<div>
						<Button
							style={{ lineHeight: 0 }}
							icon={<Icons.Check />}
							type="primary"
							onClick={this.onSave}
						>
							Done
						</Button>
					</div>
					
					<div>
						<Button onClick={this.onDiscard} icon={<Icons.XCircle />} >Cancel</Button>
					</div>
					<div>
						<Button type="link" onClick={this.onSetDefaults}>Set defaults</Button>
					</div>
				</ActionsBar>
			</div>
		)
	}
}
