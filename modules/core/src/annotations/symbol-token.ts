/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

export const symbol_token = Symbol.for('œœ.decorator.token')

export function SymbolToken(pkg_name: string) {
    return (target: any) => {
        Object.defineProperty(target, symbol_token, { enumerable: false, writable: false, value: Symbol.for(`œœ.replaced.token.${pkg_name}.${target.name}`) })
    }
}
