import React from "react"
import NFCModel from "comty.js/models/nfc"
import { Icons } from "components/Icons"

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

        console.log(result)

        switch (result.behavior.type) {
            case "url": {
                return window.location.href = result.behavior.value
            }
            case "profile": {
                return app.navigation.goToAccount(result.behavior.value)
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