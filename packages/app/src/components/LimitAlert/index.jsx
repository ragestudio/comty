import { Alert } from "antd"

const FetchLimit = async (limit_id) => {
    if (!limit_id) {
        throw new Error("limit_id is required")
    }

    const response = await app.cores.api.customRequest({
        method: "GET",
        url: `/global_server_limits/${limit_id}`,
    })

    return response.data
}

const Limit = (props) => {
    const { limit_id } = props

    if (!limit_id) {
        console.error("limit_id is required")
        return null
    }

    const [L_Limit, R_Limit, E_Limit, M_Limit] = app.cores.api.useRequest(FetchLimit, limit_id)

    if (E_Limit) {
        console.log(`Failed to fetch limit ${limit_id} >`, E_Limit)

        return null
    }

    if (L_Limit) {
        return null
    }

    const componentProps = {
        type: "warning",
        closable: true,
        ...R_Limit?.data?.componentProps ?? {},
    }

    return <Alert
        {...componentProps}
        message={R_Limit?.data?.message ?? "Warning"}
        description={R_Limit?.data?.description ?? "An limit has been reached"}
    />
}

export default (props) => {
    const { limit_id } = props

    if (Array.isArray(limit_id)) {
        return limit_id.map((limit_id) => <Limit key={limit_id} limit_id={limit_id} />)
    }

    return <Limit {...props} />
}