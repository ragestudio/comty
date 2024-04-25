import React from "react"

import { Icons } from "@components/Icons"
import SearchButton from "@components/SearchButton"
import Image from "@components/Image"

import "./index.less"

const FieldItem = (props) => {
    return <div className="marketplace-field-item">
        <div className="marketplace-field-item-image">
            <Image
                src={props.image}
            />
        </div>

        <div className="marketplace-field-item-info">
            <h1>
                {props.title}
            </h1>

            <p>
                {props.description}
            </p>
        </div>
    </div>
}

const ExtensionsBrowser = () => {
    return <div className="marketplace-field">
        <div className="marketplace-field-header">
            <h1>
                <Icons.MdCode />
                Extensions
            </h1>
        </div>

        <div className="marketplace-field-slider">
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
}

const Marketplace = () => {
    return <div className="marketplace">
        <div className="marketplace-header">
            <div className="marketplace-header-card">
                <h1>
                    Marketplace
                </h1>
            </div>

            <SearchButton />
        </div>

        <ExtensionsBrowser />
        <ExtensionsBrowser />
        <ExtensionsBrowser />
    </div>
}

export default Marketplace