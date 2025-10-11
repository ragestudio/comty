import { Tag } from "antd"
import { Icons } from "@components/Icons"

const ProductChannelBadge = () => {
	if (window.location.hostname === "comty.app") {
		return <Tag>αlpha</Tag>
	}

	if (window.location.hostname === "staging.comty.app") {
		return <Tag>staging</Tag>
	}

	return <Tag color={"magenta"}>dev</Tag>
}

export default ProductChannelBadge
