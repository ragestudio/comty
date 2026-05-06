import Client from "@ragestudio/scylla-odm"
import TestModel from "@db/test_key"

async function main() {
	console.time("new ScyllaClient")
	const client = new Client()
	console.timeEnd("new ScyllaClient")

	console.time("initialize")
	await client.initialize()
	console.timeEnd("initialize")

	let obj = null

	for (let i = 0; i < 100; i++) {
		console.time("TestModel.create")
		obj = TestModel.create({
			key: "a_date",
			value: new Date().toISOString(),
		})
		console.timeEnd("TestModel.create")

		console.time("testModel.save")
		await obj.save()
		console.timeEnd("testModel.save")
	}

	console.time("testModel.save")
	await obj.save()
	console.timeEnd("testModel.save")

	let res = null

	for (let i = 0; i < 100; i++) {
		console.time("TestModel.findOne")
		res = await TestModel.findOne(
			{
				key: "a_date",
			},
			{
				raw: true,
			},
		)
		console.timeEnd("TestModel.findOne")
	}

	console.log(res.key)

	console.log("test model", res)
}

main()
