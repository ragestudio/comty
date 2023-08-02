export default class PerformanceLog {
    constructor(
        id,
        params = {
            disabled: false
        }
    ) {
        this.id = id
        this.params = params

        this.table = {}

        return this
    }

    start(event) {
        if (this.params.disabled) {
            return false
        }

        if (!this.table[event]) {
            this.table[event] = {}
        }

        return this.table[event]["start"] = performance.now()
    }

    end(event) {
        if (this.params.disabled) {
            return false
        }

        if (!this.table[event]) {
            return
        }

        return this.table[event]["end"] = performance.now()
    }

    finally() {
        if (this.params.disabled) {
            return false
        }

        console.group(this.id)

        Object.entries(this.table).forEach(([entry, value]) => {
            console.log(entry, `${(value.end - value.start).toFixed(0)}ms`)
        })

        console.groupEnd()
    }
}