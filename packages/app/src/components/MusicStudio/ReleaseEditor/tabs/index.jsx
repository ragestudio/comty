import { Icons, createIconRender } from "@components/Icons"

import BasicInformation from "./BasicInformation"
import Tracks from "./Tracks"
import Advanced from "./Advanced"

export default [
    {
        key: "info",
        label: "Info",
        icon: <Icons.MdInfo />,
        render: BasicInformation,
    },
    {
        key: "tracks",
        label: "Tracks",
        icon: <Icons.MdLibraryMusic />,
        render: Tracks,
    },
    {
        key: "advanced",
        label: "Advanced",
        icon: <Icons.MdSettings />,
        render: Advanced,
    }
]