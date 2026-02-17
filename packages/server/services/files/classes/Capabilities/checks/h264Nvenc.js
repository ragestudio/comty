import child_proccess from "node:child_process"

export default () => {
	return new Promise((resolve, reject) => {
		try {
			child_proccess.exec(
				"ffmpeg -v error -f lavfi -i testsrc -t 0.5 -c:v h264_nvenc -f null -",
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
