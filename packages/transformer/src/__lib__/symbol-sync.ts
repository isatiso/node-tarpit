/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import ts from 'typescript'

export class SymbolSync {
    private _set: Set<ts.Symbol> = new Set()

    constructor(
        private ctx: ts.TransformationContext,
        private type_checker: ts.TypeChecker
    ) {
    }

    add(symbol: ts.Symbol) {
        return this._set.add(symbol)
    }

    update_identifier_by_symbol(source_file: ts.SourceFile) {
        const updater: ts.Visitor = node => {
            if (ts.isIdentifier(node)) {
                const symbol = this.type_checker.getSymbolAtLocation(node)
                if (symbol && this._set.has(symbol)) {
                    return this.ctx.factory.createIdentifier(symbol.getName())
                }
            }
            return ts.visitEachChild(node, updater, this.ctx)
        }
        return ts.visitNode(source_file, updater)
    }
}
