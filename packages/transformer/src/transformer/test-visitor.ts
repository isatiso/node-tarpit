/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import * as ts from 'typescript'

const SyntaxKindMap: Record<string, any> = []
for (const [k, v] of Object.entries(ts.SyntaxKind)) {
    if (/^[0-9]+$/.test(k)) {
        continue
    }
    if (!SyntaxKindMap[v]) {
        SyntaxKindMap[v] = []
    }
    SyntaxKindMap[v].push(k)
}

export function test_visitor(_: ts.Program) {
    return (ctx: ts.TransformationContext) => {
        return (sourceFile: ts.SourceFile) => {
            let indent = 0
            if (sourceFile.fileName === '/Users/caojiahang/代码/tsb/tsb-transformer/test/index.ts') {
                const visitor = (node: ts.Node): any => {
                    let msg: any = ''
                    if (ts.isStringLiteral(node)) {
                        msg = node.text
                    } else if (ts.isNumericLiteral(node)) {
                        msg = node.text
                    } else if (ts.isIdentifier(node)) {
                        msg = node.text
                    } else if (ts.isDecorator(node)) {
                        msg = node.getText(sourceFile)
                    } else if (ts.isToken(node)) {
                        msg = ts.tokenToString(node.kind)
                    } else if (ts.isSourceFile(node)) {
                        msg = node.fileName
                    } else if (ts.isBinaryExpression(node)) {
                        msg = ts.tokenToString(node.operatorToken.kind)
                    }
                    if (msg) {
                        console.info(''.padEnd(indent), SyntaxKindMap[node.kind][0], '=> {', msg, '}')
                    } else {
                        console.info(''.padEnd(indent), SyntaxKindMap[node.kind][0])
                    }

                    indent += 4
                    const res = ts.visitEachChild(node, visitor, ctx)
                    indent -= 4
                    return res
                }

                return ts.visitNode(sourceFile, visitor)

            } else {
                const visitor = (node: ts.Node): any => {
                    return ts.visitEachChild(node, visitor, ctx)
                }
                return ts.visitNode(sourceFile, visitor)
            }
        }
    }
}
