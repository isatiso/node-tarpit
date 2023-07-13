/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import fs from 'fs'
import mm from 'micromatch'
import path from 'path'
import * as ts from 'typescript'
import { SymbolSync } from './symbol-sync'

export class ScannerExit extends Error {

}

export function exit_visitor(): never {
    throw new ScannerExit()
}

export interface ImportScanResult {
    identifier: ts.Identifier,
    content: Buffer
}

function resolve_module(id: string | string[]): string | undefined {
    try {
        if (Array.isArray(id)) {
            return path.dirname(require.resolve(path.join(...id, 'package.json')))
        } else {
            return path.dirname(require.resolve(path.join(id, 'package.json')))
        }
    } catch (e) {
        return
    }
}

export class Scanner {

    private readonly typeChecker: ts.TypeChecker
    private symbols: SymbolSync

    constructor(
        private source_file: ts.SourceFile,
        private ctx: ts.TransformationContext,
        private program: ts.Program,
    ) {
        this.typeChecker = this.program.getTypeChecker()
        this.symbols = new SymbolSync(ctx, this.typeChecker)
    }

    create_path_matcher(pattern?: string[]) {
        return (node: ts.ImportDeclaration) => {
            if (!pattern?.length) {
                return false
            }
            const import_path = node.moduleSpecifier.getText(this.source_file).replace(/['"]/g, '')
            let module_path: string | undefined
            if (import_path.startsWith('.')) {
                module_path = path.resolve(path.dirname(this.source_file.fileName), import_path)
            } else if (import_path.startsWith('@')) {
                const seg = import_path.split(path.sep)
                const pkg_path = resolve_module(seg.slice(0, 2))
                if (pkg_path) {
                    module_path = path.join(pkg_path, ...seg.slice(2))
                }
            } else {
                const seg = import_path.split(path.sep)
                const pkg_path = resolve_module(seg.slice(0, 1))
                if (pkg_path) {
                    module_path = path.join(pkg_path, ...seg.slice(1))
                }
            }
            if (module_path && fs.existsSync(module_path)) {
                return mm.isMatch(module_path, pattern)
            } else {
                return false
            }
        }
    }

    find_import(node: ts.Node, visitor: ts.Visitor, filter: (node: ts.ImportDeclaration) => boolean): ImportScanResult {

        if (!ts.isImportDeclaration(node) || !node.importClause || !filter(node)) {
            exit_visitor()
        }

        const import_path = node.moduleSpecifier.getText(this.source_file).replace(/['"]/g, '')
        const source_path = this.source_file.fileName
        const content_path = import_path.startsWith('.') ? path.resolve(path.dirname(source_path), import_path) : import_path

        let identifier: ts.Identifier
        if (node.importClause.name) {
            identifier = node.importClause.name
        } else if (node.importClause.namedBindings && ts.isNamespaceImport(node.importClause.namedBindings)) {
            identifier = node.importClause.namedBindings.name
        } else {
            exit_visitor()
        }

        const symbol = this.typeChecker.getSymbolAtLocation(identifier)
        if (symbol) {
            this.symbols.add(symbol)
        }

        try {
            return { identifier, content: fs.readFileSync(content_path) }
        } catch (e) {
            exit_visitor()
        }
    }

    create_visitor(processor: (node: ts.Node) => any): ts.Visitor<ts.Node, ts.Node> {
        const visitor: ts.Visitor<ts.Node, ts.Node> = (node: ts.Node) => {
            try {
                return processor(node)
            } catch (e) {
                if (e instanceof ScannerExit) {
                    return ts.visitEachChild(node, visitor, this.ctx)
                }
            }
        }
        return visitor
    }

    traverse(visitor: ts.Visitor<ts.Node, ts.Node>) {
        return this.symbols.update_identifier_by_symbol(ts.visitNode(this.source_file, visitor))
    }
}
