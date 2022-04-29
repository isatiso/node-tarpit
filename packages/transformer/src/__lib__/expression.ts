import ts from 'typescript'

export class Expression {

    private _fac: ts.NodeFactory

    constructor(
        factory: ts.NodeFactory
    ) {
        this._fac = factory
    }

    buffer_from(buffer: Buffer) {
        return this._fac.createCallExpression(
            this._fac.createPropertyAccessExpression(
                this._fac.createIdentifier('Buffer'),
                this._fac.createIdentifier('from')
            ),
            undefined,
            [
                this._fac.createStringLiteral(buffer.toString('base64')),
                this._fac.createStringLiteral('base64')
            ]
        )
    }

    string_from(str: string) {
        return this._fac.createStringLiteral(str)
    }

    json_from(json: object | string | number) {
        return this._fac.createCallExpression(
            this._fac.createPropertyAccessExpression(
                this._fac.createIdentifier('JSON'),
                this._fac.createIdentifier('parse')
            ),
            undefined,
            [this._fac.createStringLiteral(JSON.stringify(json))]
        )
    }
}
