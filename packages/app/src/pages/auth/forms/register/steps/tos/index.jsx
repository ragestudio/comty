import React from "react"
import * as antd from "antd"

import MarkdownReader from "@components/MarkdownReader"
import config from "@config"

const FrameStyle = {
    "width": "60vw",
    "max-width": "60vw",
    "height": "90vh",
    "max-height": "90vh",
    "overflow": "overlay",
    "justify-content": "flex-start",
}

const LegalDocumentsDecorators = {
    "terms": "Terms of Service",
    "privacy": "Privacy Policy",
}

function composeConfirmationCheckboxLabel(documents) {
    let labels = [
        "I have read and accept"
    ]

    documents.forEach(([key, value], index) => {
        const isLast = index === documents.length - 1

        labels.push(`the ${LegalDocumentsDecorators[key] ?? `document (${key})`} ${!isLast ? "and" : ""}`)
    })

    return labels.join(" ")
}

const TermsOfServiceStepComponent = (props) => {
    const legalDocuments = Object.entries(config.legal)

    return <div className="register_form_step_content">
        {
            Object.entries(config.legal).map(([key, value]) => {
                if (!value) {
                    return null
                }

                return <antd.Button
                    key={key}
                    onClick={() => {
                        app.layout.modal.open(key, MarkdownReader, {
                            includeCloseButton: true,
                            frameContentStyle: FrameStyle,
                            props: {
                                url: value
                            }
                        })
                    }}
                >
                    Read {LegalDocumentsDecorators[key] ?? `document (${key})`}
                </antd.Button>
            })
        }

        <antd.Checkbox
            defaultChecked={props.currentValue}
            onChange={(event) => {
                props.updateValue(event.target.checked)
            }}
        >
            {composeConfirmationCheckboxLabel(legalDocuments)}
        </antd.Checkbox>
    </div>
}

export default {
    key: "tos",
    title: "Step 3",
    icon: "FileDone",
    description: "Take your time to read these legal documents.",
    required: true,
    content: TermsOfServiceStepComponent,
}
