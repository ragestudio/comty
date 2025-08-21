export default async function (groupId) {
	return Array.from(this.instances.values()).filter((channelInstance) => {
		return channelInstance.data.group_id === groupId
	})
}
