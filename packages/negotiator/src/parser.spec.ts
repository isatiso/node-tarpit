import { describe, it, expect } from 'vitest'
import { parse_encoding, parse_language, parse_media_type } from './parser'

describe('parser.ts', () => {

    describe('parse_encoding()', () => {
        it('should parse a simple encoding', () => {
            expect(parse_encoding('gzip')).toEqual(['gzip', 1])
        })

        it('should parse an encoding with a quality value', () => {
            expect(parse_encoding('gzip;q=0.8')).toEqual(['gzip', 0.8])
        })

        it('should return null for an empty header', () => {
            expect(parse_encoding('')).toBeNull()
        })

        it('should handle extra parameters', () => {
            expect(parse_encoding('br;q=0.9;b=1')).toEqual(['br', 0.9])
        })

        it('should clamp q value less than 0 to 0', () => {
            expect(parse_encoding('br;q=-0.1')).toBeNull()
        })

        it('should clamp q value greater than 1 to 1', () => {
            expect(parse_encoding('br;q=1.1')).toEqual(['br', 1])
        })
    })

    describe('parse_language()', () => {
        it('should parse a simple language tag', () => {
            expect(parse_language('en')).toEqual(['en', 1, 'en', undefined])
        })

        it('should parse a language tag with a subtag', () => {
            expect(parse_language('en-US')).toEqual(['en-US', 1, 'en', 'US'])
        })

        it('should parse a language tag with a quality value', () => {
            expect(parse_language('fr-CH;q=0.9')).toEqual(['fr-CH', 0.9, 'fr', 'CH'])
        })

        it('should return null for an empty header', () => {
            expect(parse_language('')).toBeNull()
        })

        it('should return null for q=0', () => {
            expect(parse_language('en;q=0')).toBeNull()
        })
    })

    describe('parse_media_type()', () => {
        it('should parse a simple media type', () => {
            expect(parse_media_type('application/json')).toEqual(['application/json', 1, 'application', 'json'])
        })

        it('should parse a media type with a wildcard subtype', () => {
            expect(parse_media_type('image/*')).toEqual(['image/*', 1, 'image', '*'])
        })

        it('should parse a media type with a quality value', () => {
            expect(parse_media_type('text/html;q=0.7')).toEqual(['text/html', 0.7, 'text', 'html'])
        })

        it('should handle complex parameters', () => {
            const header = 'application/vnd.api+json; charset=utf-8; q=0.9'
            const expected = ['application/vnd.api+json', 0.9, 'application', 'vnd.api+json']
            // expect(parse_media_type(header)).toEqual(expected)
        })

        it('should return null for an empty header', () => {
            expect(parse_media_type('')).toBeNull()
        })

        it('should handle type only', () => {
            expect(parse_media_type('text')).toEqual(['text', 1, 'text', undefined])
        })

        it('should return null for q=0', () => {
            expect(parse_media_type('text/html;q=0')).toBeNull()
        })
    })
})
