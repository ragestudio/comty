import React from "react"

import { v86WASM, seabios, vgabios } from "v86/build/binaries"

import "./libv86" 

import HDARaw from "../../../../public/98raw01.img?url"

console.log(V86)

const V86Machine = (props) => {
    const vmref = React.useRef()

    const loadVM = async () => {
        const vm = new V86Starter({
            wasm_fn: async (param) => (await WebAssembly.instantiate(await v86WASM, param)).instance.exports,
            memory_size: 64 * 1024 * 1024,
            vga_memory_size: 2 * 1024 * 1024,
            screen_container: document.getElementById("screen_container"),
            bios: {
                buffer: await seabios,
            },
            vga_bios: {
                buffer: await vgabios,
            },
            hda: {
                url: HDARaw,
                size: 2 * 1024 * 1024 * 1024,
                async: true
            },
            autostart: true
        })

        vmref.current = vm
        console.log(vm.current)
    }

    React.useEffect(() => {
        if (props.updateDimensions) {
            props.updateDimensions({
                width: 720,
                height: 480,
            })
        }

        loadVM()
    }, [])

    return <div id="screen_container">
        <div
            style={{
                whiteSpace: "pre",
                fontFamily: "DM Mono, monospace",
                fontSize: "14px",
                lineHeight: "14px",
                color: "var(--text-color)",
            }}
        />
        <canvas
            style={{
                display: "none"
            }}
        />
    </div>
}

export default V86Machine