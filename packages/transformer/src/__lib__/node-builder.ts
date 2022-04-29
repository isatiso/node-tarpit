import ts from 'typescript'
import { Expression } from './expression'
import { Statement } from './statement'

export class NodeBuilder {

    private _fac: ts.NodeFactory
    private s: Statement
    private e: Expression

    constructor(
        factory: ts.NodeFactory,
    ) {
        this._fac = factory
        this.s = new Statement(factory)
        this.e = new Expression(factory)
    }

    declare_buffer(identifier: ts.Identifier, buffer: Buffer) {
        const type = this._fac.createTypeReferenceNode('Buffer')
        return this.s.declare_variable(identifier, type, this.e.buffer_from(buffer))
    }

    declare_string(identifier: ts.Identifier, str: string) {
        const type = this._fac.createTypeReferenceNode('string')
        return this.s.declare_variable(identifier, type, this.e.string_from(str))
    }

    declare_json(identifier: ts.Identifier, json: object | string | number) {
        return this.s.declare_variable(identifier, undefined, this.e.json_from(json))
    }
}
