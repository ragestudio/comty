import child_proccess from "node:child_process"

export default () => {
	return new Promise((resolve, reject) => {
		try {
			child_proccess.exec(
				"ffmpeg -f lavfi -i testsrc -t 1 -c:v hevc_nvenc -f null -",
				(error, stdout, stderr) => {
					if (error) {
						resolve(false)
					} else {
						resolve(true)
					}
				},
			)
		} catch (e) {
			resolve(false)
		}
	})
}
