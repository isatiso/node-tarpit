import yaml from 'js-yaml'
import * as ts from 'typescript'
import { NodeBuilder } from '../__lib__/node-builder'
import { Scanner } from '../__lib__/scanner'

/**
 * {
 *    "transform": "@tarpit/transformer",
 *     "import": "import_yaml",
 *     "pattern": ["**\/*.yaml", "**\/*.yml"]
 * }
 */
export function import_yaml(program: ts.Program, options: { pattern?: string | string[] }) {
    const pattern = options.pattern ? typeof options.pattern === 'string' ? [options.pattern] : options.pattern : ['**/*.yaml', '**/*.yml']
    return (ctx: ts.TransformationContext) => {
        return (sourceFile: ts.SourceFile) => {
            const scanner = new Scanner(sourceFile, ctx, program)
            const is_path_match = scanner.create_path_matcher(pattern)
            const visitor: ts.Visitor = scanner.create_visitor(node => {
                const { identifier, content } = scanner.find_import(node, visitor, is_path_match)
                let obj: object | string | number | null | undefined = null
                try {
                    obj = yaml.load(content.toString('utf-8')) as any
                } catch (e) {
                }
                if (!obj) {
                    return
                }
                return new NodeBuilder(ctx.factory).declare_json(identifier, obj)
            })
            return scanner.traverse(visitor)
        }
    }
}
