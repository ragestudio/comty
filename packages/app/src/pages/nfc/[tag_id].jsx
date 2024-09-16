import React from "react"
import { Icons } from "@components/Icons"

import NFCModel from "comty.js/models/nfc"

export default (props) => {
    const { tag_id } = props.params

    const execution = async () => {
        const result = await NFCModel.getTagById(tag_id)
            .catch((err) => {
                console.log(err)
                app.message.error("NFC Tag not found")
                return false
            })

        if (!result) {
            return false
        }

        switch (result.behavior.type) {
            case "url": {
                return window.location.href = result.behavior.value
            }
            case "profile": {
                return app.navigation.goToAccount(result.behavior.value)
            }
            case "random_list": {
                const values = result.behavior.value.split(";")

                const index = Math.floor(Math.random() * values.length)

                return window.location.href = values[index]
            }
        }
    }

    React.useEffect(() => {
        execution()
    }, [])

    return <div className="nfc_execution">
        <Icons.LoadingOutlined
            style={{
                fontSize: 64
            }}
            spin
        />
    </div>
}