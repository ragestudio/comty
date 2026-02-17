import React from "react"
import { Renderer, Program, Mesh, Color, Triangle } from "ogl"

const vertexShader = `
attribute vec2 uv;
attribute vec2 position;

varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = vec4(position, 0, 1);
}
`

const fragmentShader = `
precision highp float;

uniform float uTime;
uniform vec3 uColor;
uniform vec3 uResolution;
uniform float uAmplitude;
uniform float uSpeed;

varying vec2 vUv;

void main() {
  float mr = min(uResolution.x, uResolution.y);
  vec2 uv = (vUv.xy * 2.0 - 1.0) * uResolution.xy / mr;

  uv += vec2(0.5) * uAmplitude;

  float d = -uTime * 0.5 * uSpeed;
  float a = 0.0;
  for (float i = 0.0; i < 8.0; ++i) {
    a += cos(i - d - a * uv.x);
    d += sin(uv.y * i + a);
  }
  d += uTime * 0.5 * uSpeed;
  vec3 col = vec3(cos(uv * vec2(d, a)) * 0.6 + 0.4, cos(a + d) * 0.5 + 0.5);
  col = cos(col * cos(vec3(d, a, 2.5)) * 0.5 + 0.5) * uColor;
  gl_FragColor = vec4(col, 1.0);
}
`

const Background = ({
	color = [1, 1, 1],
	speed = 1.0,
	amplitude = 0.1,
	...rest
}) => {
	const ctnDom = React.useRef(null)

	React.useEffect(() => {
		if (!ctnDom.current) {
			return null
		}

		const renderer = new Renderer()
		let program = null

		const ctn = ctnDom.current
		const gl = renderer.gl

		gl.clearColor(1, 1, 1, 1)

		function resize() {
			const scale = 1

			renderer.setSize(ctn.offsetWidth * scale, ctn.offsetHeight * scale)

			if (program) {
				program.uniforms.uResolution.value = new Color(
					gl.canvas.width,
					gl.canvas.height,
					gl.canvas.width / gl.canvas.height,
				)
			}
		}

		window.addEventListener("resize", resize, false)

		resize()

		const geometry = new Triangle(gl)

		program = new Program(gl, {
			vertex: vertexShader,
			fragment: fragmentShader,
			uniforms: {
				uTime: { value: 0 },
				uColor: { value: new Color(...color) },
				uResolution: {
					value: new Color(
						gl.canvas.width,
						gl.canvas.height,
						gl.canvas.width / gl.canvas.height,
					),
				},
				uAmplitude: { value: amplitude },
				uSpeed: { value: speed },
			},
		})

		const mesh = new Mesh(gl, { geometry, program })

		let animateId = null

		function update(t) {
			animateId = requestAnimationFrame(update)
			program.uniforms.uTime.value = t * 0.001
			renderer.render({ scene: mesh })
		}

		animateId = requestAnimationFrame(update)
		ctn.appendChild(gl.canvas)

		return () => {
			cancelAnimationFrame(animateId)
			window.removeEventListener("resize", resize)

			ctn.removeChild(gl.canvas)
			gl.getExtension("WEBGL_lose_context")?.loseContext()
		}
	}, [color, speed, amplitude])

	return (
		<div
			ref={ctnDom}
			className="iridescence-container"
			{...rest}
		/>
	)
}

export default Background
