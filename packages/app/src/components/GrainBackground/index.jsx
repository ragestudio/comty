import { Renderer, Program, Mesh, Plane } from "ogl"

const vertex = `
  attribute vec2 uv;
  attribute vec2 position;

  varying vec2 vUv;

  void main() {
      vUv = uv;
      //gl_Position = vec4(position.xy * 2.0, 0.0, 1.0);
      gl_Position = vec4(position, 0, 1);
  }
`

const fragment = `
  precision highp float;
  varying vec2 vUv;

  // float random(vec2 st) {
  //     return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
  // }

  float getNoise(vec2 seed) {
      vec2 theta_factor_a = vec2(0.9898, 0.233);
      vec2 theta_factor_b = vec2(12.0, 78.0);

      float theta_a = dot(seed.xy, theta_factor_a);
      float theta_b = dot(seed.xy, theta_factor_b);
      float theta_c = dot(seed.yx, theta_factor_a);
      float theta_d = dot(seed.yx, theta_factor_b);

      float value = cos(theta_a) * sin(theta_b) + sin(theta_c) * cos(theta_d);
      float temp = mod(197.0 * value, 1.0) + value;
      float part_a = mod(220.0 * temp, 1.0) + temp;
      float part_b = value * 0.5453;
      float part_c = cos(theta_a + theta_b) * 0.43758;

      return fract(part_a + part_b + part_c);
  }

  void main() {
      vec2 uv = vUv;

      float grainIntensity = 1.3;
      float grain = getNoise(uv) * grainIntensity;

      gl_FragColor = vec4(vec3(grain), 0.8);
  }
`

const Grain = () => {
	const ctnDom = React.useRef(null)
	const renderer = React.useRef(null)
	const scene = React.useRef(null)
	const resizeDebounce = React.useRef(null)

	const render = React.useCallback(() => {
		renderer.current.setSize(window.innerWidth, window.innerHeight)
		renderer.current.render({ scene: scene.current })
	}, [])

	const onResize = React.useCallback(() => {
		if (resizeDebounce.current) {
			clearTimeout(resizeDebounce.current)
		}

		resizeDebounce.current = setTimeout(() => {
			render()
		}, 100)
	}, [])

	React.useEffect(() => {
		if (!ctnDom.current) {
			return null
		}

		renderer.current = new Renderer({
			//antialias: false,
			dpr: 2,
			alpha: true,
		})

		const geometry = new Plane(renderer.current.gl, {
			width: 2,
			height: 2,
		})

		const program = new Program(renderer.current.gl, {
			vertex,
			fragment,
			transparent: true,
		})

		scene.current = new Mesh(renderer.current.gl, { geometry, program })

		ctnDom.current.appendChild(renderer.current.gl.canvas)
		window.addEventListener("resize", onResize, false)

		render()
		return () => {
			window.removeEventListener("resize", onResize, false)
			renderer.destroy()
		}
	}, [])

	return (
		<div
			ref={ctnDom}
			className="grain_bg"
			style={{
				position: "fixed",
				top: 0,
				left: 0,
				backgroundColor: "transparent",
				mixBlendMode: "overlay",
				pointerEvents: "none",
			}}
		/>
	)
}

export default Grain
