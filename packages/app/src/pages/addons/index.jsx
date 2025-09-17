import React from "react"

import { Icons } from "@components/Icons"
import SearchButton from "@components/SearchButton"
import Image from "@components/Image"

import "./index.less"

const FieldItem = (props) => {
	return (
		<div className="addons-field-item">
			<div className="addons-field-item-image">
				<Image src={props.image} />
			</div>

			<div className="addons-field-item-info">
				<h1>{props.title}</h1>

				<p>{props.description}</p>
			</div>
		</div>
	)
}

const AddonsBrowser = () => {
	return (
		<div className="addons-field">
			<div className="addons-field-header">
				<h1>
					<Icons.CodeXml />
					Addons
				</h1>
			</div>

			<div className="addons-field-slider">
				<FieldItem
					title="Example Extension"
					description="Description"
					image="https://placehold.co/400x400"
				/>
				<FieldItem
					title="Example Extension"
					description="Description"
					image="https://placehold.co/400x400"
				/>
				<FieldItem
					title="Example Extension"
					description="Description bla blalbabla blalbabla blalbabla blalbabla blalbabla blalba"
					image="https://placehold.co/400x400"
				/>
				<FieldItem
					title="Bad image resolution"
					description="Description"
					image="https://placehold.co/1920x1080"
				/>
			</div>
		</div>
	)
}

const addons = () => {
	return (
		<div className="addons-page">
			<div className="addons-header">
				<div className="addons-header-card">
					<h1>Addons</h1>
				</div>

				<SearchButton />
			</div>

			<AddonsBrowser />
			<AddonsBrowser />
			<AddonsBrowser />
		</div>
	)
}

export default addons
