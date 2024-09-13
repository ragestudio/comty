import { Translation } from "react-i18next"
import { createIconRender } from "@components/Icons"

export default (items) => {
    return items.map((item) => {
        return {
            id: item.id,
            key: item.id,
            path: item.path,
            icon: createIconRender(item.icon),
            label: <Translation>
                {t => t(item.title ?? item.label ?? item.id)}
            </Translation>,
            danger: item.danger,
            disabled: item.disabled,
            children: item.children,
        }
    })
}