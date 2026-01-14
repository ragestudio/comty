import child_proccess from "node:child_process"

export default () => {
	return new Promise((resolve, reject) => {
		try {
			child_proccess.exec(
				"ffmpeg -init_hw_device vaapi=foo:/dev/dri/renderD128 -filter_hw_device foo -f lavfi -i testsrc -t 1 -vf format=nv12,hwupload -c:v h264_vaapi -f null -",
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
