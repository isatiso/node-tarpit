/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { TpService, TpModule, TpRoot } from '../annotations'
import { TpConfigData } from '../builtin/tp-config-data'
import { TpLoader } from '../builtin/tp-loader'
import { Injector } from '../di'
import { get_class_decorator } from './decorator'

/**
 * Print all providers in the injector hierarchy in a tree structure
 * showing injector relationships and their providers.
 */
export function print_provider_tree(root_injector: Injector): string {
    const lines= ['Injector']
    print_child_content(root_injector, lines, '')
    return lines.join('\n')
}

function print_child_content(injector: Injector, lines: string[], prefix: string) {
    // Get all providers from this injector
    const own_providers: Array<[any, any]> = []
    for (const [token, provider] of injector['providers']) {
        if (token !== Injector) {
            own_providers.push([token, provider])
        }
    }

    // Calculate total items
    const total_items = own_providers.length + injector.children.length

    // Print providers
    own_providers.forEach(([token, provider], index) => {
        const is_last_item = index === total_items - 1
        const item_prefix = is_last_item ? '└── ' : '├── '
        const provider_name = get_provider_name_with_type(token, provider)
        lines.push(`${prefix}${item_prefix}${provider_name}`)
    })

    // Print child injectors
    injector.children.forEach((child, index) => {
        const child_index = own_providers.length + index
        const is_last_item = child_index === total_items - 1
        const item_prefix = is_last_item ? '└── ' : '├── '
        const child_prefix = prefix + (is_last_item ? '    ' : '│   ')

        // Get child injector name
        let child_injector_name = 'Injector'
        const tp_root_name = find_tp_root_for_injector(child)
        if (tp_root_name) {
            child_injector_name += ` (${tp_root_name})`
        }

        // Print connector and child injector name
        lines.push(`${prefix}${item_prefix}${child_injector_name}`)

        // Recursively print child content
        print_child_content(child, lines, child_prefix)
    })

    // Handle case where there are no providers and no children
    if (total_items === 0) {
        lines.push(`${prefix}└── (no providers)`)
    }
}

function find_tp_root_for_injector(injector: Injector): string | null {
    // Look through all providers in this injector to find TpRoot
    for (const [token, provider] of injector['providers']) {
        if (typeof token === 'function' && token.prototype) {
            const decorators = get_class_decorator(token)
            if (decorators.length > 0) {
                const decorator = decorators[0]
                if (decorator instanceof TpRoot) {
                    return token.name || 'Unknown'
                }
            }
        }
    }
    return null
}

function get_provider_name_with_type(token: any, provider: any): string {
    const base_name = get_provider_name(token, provider)
    const type_info = get_provider_type(token)

    if (type_info) {
        return `${base_name} [${type_info}]`
    }

    return base_name
}

function get_provider_type(token: any): string | null {
    // Check for built-in services FIRST - priority over decorators
    if (token === TpConfigData || token === TpLoader) {
        return 'Built-in'
    }

    // Check if token name indicates it's Platform
    if (typeof token === 'function' && token.name === 'Platform') {
        return 'Built-in'
    }

    // Check if it's a class constructor with decorators
    if (typeof token === 'function' && token.prototype) {
        const decorators = get_class_decorator(token)

        if (decorators.length > 0) {
            const decorator = decorators[0]

            if (decorator instanceof TpService) {
                return 'TpWorker → @TpService'
            } else if (decorator instanceof TpModule) {
                return 'TpAssembly → @TpModule'
            } else if (decorator instanceof TpRoot) {
                return 'TpEntry → @TpRoot'
            }
        }
    }

    return null
}

function get_provider_name(token: any, provider: any): string {
    if (typeof token === 'function') {
        return token.name || 'Anonymous'
    } else if (typeof token === 'string') {
        return `"${token}"`
    } else if (typeof token === 'symbol') {
        return token.toString()
    } else {
        return String(token)
    }
}
