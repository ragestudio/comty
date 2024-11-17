export default class Clock {
    registerWidgets = [
        {
            name: "Clock",
            description: "Display the current time",
            component: () => import("./clock.jsx"),
        }
    ]

    registerPages = [
        {
            path: "/clock",
            component: () => import("./clock.jsx"),
        }
    ]

    public = {
        echo: (...str) => {
            this.console.log(...str)
        },
        fib: (n) => {
            let a = 0, b = 1
            for (let i = 0; i < n; i++) {
                let c = a + b
                a = b
                b = c
            }
            return a
        }
    }

    events = {
        "test": (data) => {
            this.console.log("test")

            if (data) {
                this.console.log(data)
            }
        }
    }

    async onInitialize() {
        this.console.log("Hi from the extension worker!")
    }
}