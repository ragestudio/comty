import { Switch } from "antd"
import SlidersWithPresets from "../../../components/slidersWithPresets"

export default (props) => {
    return <SlidersWithPresets
        {...props}
        controller={app.cores.player.compressor.presets}
        extraHeaderItems={[
            <Switch
                onChange={props.onEnabledChange}
            />
        ]}
    />
}