import newNotification from "./newNotification"
import ackSyncNotification from "./ackSyncNotification"
import dmActivityUpdate from "./dmActivityUpdate"
import selfUserUpdate from "./selfUserUpdate"

export default {
	"notification:new": newNotification,
	"notification:ack:sync": ackSyncNotification,
	"dm:activity:update": dmActivityUpdate,
	"self:user:update": selfUserUpdate,
}
