import React from "react"
import { Alert, Divider, Checkbox, Button } from "antd"

import AuthModel from "@models/auth"

const DisableAccountPage = () => {
    const [confirm, setConfirm] = React.useState(false)

    async function submit() {
        if (!confirm) {
            return null
        }

        AuthModel.disableAccount({ confirm })
            .then(() => {
                app.message.success("Your account has been disabled. More information will be sent to your email.")
            })
            .catch(() => {
                app.message.error("Failed to disable your account.")
            })
    }

    return <div className="flex-column gap-20 align-start w-100">
        <div className="flex-column align-start">
            <h1>Account Disablement</h1>
            <p>You are about to disable your account.</p>
        </div>

        <div className="flex-column gap-10 align-start">
            <Divider
                style={{
                    margin: "5px 0"
                }}
            />
            <p>
                Due to our security policy, your data is retained when your account is disabled, this retention period is 2 months, but can be extended if appropriate.
            </p>
            <p>
                Once the account hold expires, all of your data will be permanently deleted.
            </p>
            <Divider
                style={{
                    margin: "5px 0"
                }}
            />
            <p>
                This action cannot be stopped directly, you must contact support to stop this process.
            </p>
            <p>
                <strong>
                    In case an imminent deletion is necessary, you should contact support.
                </strong>
            </p>
            <Divider
                style={{
                    margin: "5px 0"
                }} />
        </div>

        <div className="flex-column gap-10 align-start w-100">
            <p>
                These are all the data that are deleted after the retention time:
            </p>

            <ul>
                <li>Your account data</li>
                <li>Your profile</li>
                <li>Sessions logs</li>
                <li>All content you have created; tracks, videos, posts, images, products, events, etc...</li>
                <li>All information related to your account in our Databases</li>
            </ul>

            <p>
                While your account is on hold, all of your information will remain visible, but your account will not be usable by any services or log in.
            </p>

            <Divider
                style={{
                    margin: "10px 0"
                }}
            />
        </div>

        <Alert
            type="warning"
            message="Some features like API keys keeps working until your account is fully deleted."
        />

        <div className="flex-column align-start justify-space-between gap-10 w-100">
            <Checkbox
                checked={confirm}
                onChange={(e) => setConfirm(e.target.checked)}
            >
                Im aware of this action and I want to continue.
            </Checkbox>

            <Button
                type="primary"
                onClick={submit}
                disabled={!confirm}
            >
                Disable Account
            </Button>
        </div>
    </div>
}

export default DisableAccountPage