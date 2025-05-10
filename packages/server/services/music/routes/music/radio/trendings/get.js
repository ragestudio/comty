import Radio from "@classes/radio"

export default async () => {
	return {
		items: await Radio.trendings(),
	}
}
