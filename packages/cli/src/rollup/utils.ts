import builtinModules from 'builtin-modules'
import { PackageJson } from '../types'

export function gen_external(pkg: PackageJson, external?: (string | RegExp)[]) {
    return [
        ...builtinModules,
        ...Object.keys(pkg.dependencies || {}),
        ...Object.keys(pkg.peerDependencies || {}),
        ...(external ?? []),
    ]
}
