import newNotification from "./newNotification"
import ackSyncNotification from "./ackSyncNotification"
import dmActivityUpdate from "./dmActivityUpdate"

export default {
	"notification:new": newNotification,
	"notification:ack:sync": ackSyncNotification,
	"dm:activity:update": dmActivityUpdate,
}
