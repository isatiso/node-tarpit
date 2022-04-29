import ts from 'typescript'

export class Statement {

    private _fac: ts.NodeFactory

    constructor(
        factory: ts.NodeFactory
    ) {
        this._fac = factory
    }

    declare_variable(identifier: ts.BindingName, type: ts.TypeNode | undefined, initiator: ts.Expression): ts.VariableStatement {
        const declaration = this._fac.createVariableDeclaration(identifier, undefined, type, initiator)
        return this._fac.createVariableStatement(undefined, this._fac.createNodeArray([declaration]))
    }
}
