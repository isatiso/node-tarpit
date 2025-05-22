/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import * as ts from 'typescript'

/**
 * {
 *     "transform": "@tarpit/transformer",
 *     "import": "comment_decorators",
 *     "afterDeclarations": true
 * }
 */
export function comment_decorators(_: ts.Program, options: { heritage_inline?: boolean }) {
    return (ctx: ts.TransformationContext) => {
        return (sourceFile: ts.SourceFile) => {
            const visitor = (node: ts.Node): any => {
                const origin = ts.getOriginalNode(node)
                if (!ts.isClassDeclaration(origin) && !ts.isMethodDeclaration(origin)) {
                    return ts.visitEachChild(node, visitor, ctx)
                }
                const osf = origin.getSourceFile()
                const tag_array: ts.JSDocTag[] = []
                if (ts.isClassDeclaration(origin)) {
                    tag_array.push(ctx.factory.createJSDocClassTag(ctx.factory.createIdentifier('class'), origin.name?.text ?? '[anonymous]'))
                }
                const text_array: (ts.JSDocText | ts.JSDocLink)[] = []
                if (origin.modifiers) {
                    const msg = origin.modifiers
                        .filter(d => d.kind === ts.SyntaxKind.Decorator)
                        .map(d => d.getText(osf)).join('\n')
                    text_array.push(ctx.factory.createJSDocText(msg))
                }
                if (ts.isClassDeclaration(origin) && origin.heritageClauses) {
                    const msg = origin.heritageClauses.map(d => options.heritage_inline
                        ? d.getText(osf).replace(/\n+/g, '').replace(/\s+/g, ' ')
                        : d.getText(osf)
                    ).join(' ')
                    text_array.push(ctx.factory.createJSDocText('\n' + msg))
                }
                if (text_array.length || tag_array.length) {
                    return [
                        ctx.factory.createJSDocComment(
                            ctx.factory.createNodeArray(text_array),
                            ctx.factory.createNodeArray(tag_array)),
                        ts.visitEachChild(node, visitor, ctx)
                    ]
                } else {
                    return ts.visitEachChild(node, visitor, ctx)
                }
            }
            return ts.visitNode(sourceFile, visitor)
        }
    }
}
