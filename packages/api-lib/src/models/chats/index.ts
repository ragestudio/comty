import Model from "../../model"

import Channels from "./channels"
import Ack from "./ack"
import Dm from "./dm"

export class ChatsModel extends Model {
	channels = Channels
	dm = Dm
	ack = Ack
}

export default new ChatsModel()
