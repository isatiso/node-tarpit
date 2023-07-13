/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import * as ts from 'typescript'
import { NodeBuilder } from '../__lib__/node-builder'
import { Scanner } from '../__lib__/scanner'

/**
 * {
 *    "transform": "@tarpit/transformer",
 *     "import": "import_string",
 *     "pattern": ["**\/*.html"]
 * }
 */
export function import_string(program: ts.Program, options: { pattern?: string | string[] }) {
    const pattern = options.pattern ? typeof options.pattern === 'string' ? [options.pattern] : options.pattern : []
    return (ctx: ts.TransformationContext) => {
        return (sourceFile: ts.SourceFile) => {
            const scanner = new Scanner(sourceFile, ctx, program)
            const is_path_match = scanner.create_path_matcher(pattern)
            const visitor: ts.Visitor<ts.Node, ts.Node> = scanner.create_visitor(node => {
                const { identifier, content } = scanner.find_import(node, visitor, is_path_match)
                return new NodeBuilder(ctx.factory).declare_string(identifier, content.toString('utf-8'))
            })
            return scanner.traverse(visitor)
        }
    }
}
