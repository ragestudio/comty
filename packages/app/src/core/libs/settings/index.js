import config from 'config'
import DJail from '../djail'

export const settings = new DJail({ name: config.app?.storage?.settings ?? "settings", voidMutation: true })
export default settings