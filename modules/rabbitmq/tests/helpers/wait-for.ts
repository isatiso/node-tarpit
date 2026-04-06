import timers from 'node:timers/promises'

export async function wait_for(condition: () => boolean | Promise<boolean>, timeout_ms = 5000, interval_ms = 50): Promise<void> {
    const deadline = Date.now() + timeout_ms
    while (!(await condition())) {
        if (Date.now() >= deadline) {
            throw new Error(`wait_for timed out after ${timeout_ms}ms`)
        }
        await timers.setTimeout(interval_ms)
    }
}
