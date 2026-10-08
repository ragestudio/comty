import type { Client } from "@comty/shared/types/rtc/client"

export const clientName = (client: Client) =>
	client.user?.username ?? client.userId

export default clientName
