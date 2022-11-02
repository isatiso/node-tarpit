import * as core from '@actions/core'

export const set_failure = (message: string, failCi: boolean): void => {
    failCi ? core.setFailed(message) : core.warning(message)
    if (failCi) {
        process.exit()
    }
}

export function get_base_url(platform: string, version: string): string {
    return `https://uploader.codecov.io/${version}/${platform}/codecov`
}
