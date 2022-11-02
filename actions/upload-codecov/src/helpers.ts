import * as core from '@actions/core'

export function set_failure(message: string): void {
    core.setFailed(message)
    process.exit()
}

export function get_base_url(platform: string, version: string): string {
    return `https://uploader.codecov.io/${version}/${platform}/codecov`
}
