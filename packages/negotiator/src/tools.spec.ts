import { describe, it, expect } from 'vitest'
import { parse_params, split_escape_quote } from './tools'

describe('tools.ts', () => {

    describe('split_escape_quote()', () => {
        it('should split string by spliter', () => {
            expect(split_escape_quote('a;b;c', ';')).toEqual(['a', 'b', 'c'])
        })

        it('should ignore spliter inside quotes', () => {
            expect(split_escape_quote('a;"b;c";d', ';')).toEqual(['a', 'b;c', 'd'])
        })

        it('should handle escaped quotes', () => {
            expect(split_escape_quote(`a;"b;\\"c";d`, ';')).toEqual(['a', 'b;"c', 'd'])
        })

        it('should handle complex cases', () => {
            const complex_string = `a;b="c;d";e="f;\\"g";h`
            const expected = ['a', 'b="c;d"', 'e="f;\\"g"', 'h']
            expect(split_escape_quote(complex_string, ';')).toEqual(expected)
        })

        it('should handle empty parts', () => {
            expect(split_escape_quote('a;;b', ';')).toEqual(['a', '', 'b'])
        })
    })

    describe('parse_params()', () => {
        it('should parse parameters from an array of strings', () => {
            const params = ['q=1', 'b="c"']
            const expected = { q: '1', b: 'c' }
            expect(parse_params(params)).toEqual(expected)
        })

        it('should handle empty params', () => {
            expect(parse_params([])).toEqual({})
        })

        it('should handle params without values', () => {
            const params = ['a=1', 'b']
            const expected = { a: '1', b: '' }
            expect(parse_params(params)).toEqual(expected)
        })

        it('should remove wrapping quotes from values', () => {
            const params = ['a="hello"', 'b=world']
            const expected = { a: 'hello', b: 'world' }
            expect(parse_params(params)).toEqual(expected)
        })
    })
})
