
import { describe, it, expect } from 'vitest'
import { Negotiator } from './negotiator'

describe('negotiator.ts', () => {

    describe('Negotiator', () => {

        describe('.media_types()', () => {
            it('should return an array of media types', () => {
                const negotiator = new Negotiator({ 'accept': 'application/json, text/html' })
                expect(negotiator.media_types).toEqual(['application/json', 'text/html'])
            })

            it('should handle quality values', () => {
                const negotiator = new Negotiator({ 'accept': 'application/json;q=0.8, text/html' })
                expect(negotiator.media_types).toEqual(['text/html', 'application/json'])
            })

            it('should handle wildcards', () => {
                const negotiator = new Negotiator({ 'accept': 'text/*, application/json' })
                expect(negotiator.media_types).toEqual(['text/*', 'application/json'])
            })

            it('should handle */*', () => {
                const negotiator = new Negotiator({ 'accept': '*/*' })
                expect(negotiator.media_types).toEqual(['*/*'])
            })

            it('should handle no accept header', () => {
                const negotiator = new Negotiator({})
                expect(negotiator.media_types).toEqual(['*/*'])
            })

            it('should handle empty accept header', () => {
                const negotiator = new Negotiator({ 'accept': '' })
                expect(negotiator.media_types).toEqual([])
            })

            it('should use fallback when header is undefined', () => {
                const negotiator = new Negotiator({})
                expect(negotiator.media_types).toEqual(['*/*'])
            })
        })

        describe('.encodings()', () => {
            it('should return an array of encodings', () => {
                const negotiator = new Negotiator({ 'accept-encoding': 'gzip, deflate' })
                expect(negotiator.encodings).toEqual(['gzip', 'deflate', 'identity'])
            })

            it('should handle quality values', () => {
                const negotiator = new Negotiator({ 'accept-encoding': 'gzip;q=0.8, deflate' })
                expect(negotiator.encodings).toEqual(['deflate', 'gzip', 'identity'])
            })

            it('should handle wildcards', () => {
                const negotiator = new Negotiator({ 'accept-encoding': '*' })
                expect(negotiator.encodings).toEqual(['*'])
            })

            it('should handle no accept-encoding header', () => {
                const negotiator = new Negotiator({})
                expect(negotiator.encodings).toEqual(['*'])
            })

            it('should always have identity', () => {
                const negotiator = new Negotiator({ 'accept-encoding': 'gzip, deflate' })
                expect(negotiator.encodings).toContain('identity')
            })

            it('should add identity if not present', () => {
                const negotiator = new Negotiator({ 'accept-encoding': 'gzip' })
                expect(negotiator.encodings).toEqual(['gzip', 'identity'])
            })

            it('should use the lowest quality for identity', () => {
                const negotiator = new Negotiator({ 'accept-encoding': 'gzip;q=0.8, deflate;q=0.9' })
                expect(negotiator.encodings).toEqual(['deflate', 'gzip', 'identity'])
            })

            it('should add identity if not present and q > 0', () => {
                const negotiator = new Negotiator({ 'accept-encoding': 'gzip, deflate;q=0.8' })
                expect(negotiator.encodings).toEqual(['gzip', 'deflate', 'identity'])
            })

            it('should not add identity if q=0', () => {
                const negotiator = new Negotiator({ 'accept-encoding': 'gzip, deflate;q=0' })
                expect(negotiator.encodings).toEqual(['gzip', 'identity'])
            })
        })

        describe('.languages()', () => {
            it('should return an array of languages', () => {
                const negotiator = new Negotiator({ 'accept-language': 'en-US, en' })
                expect(negotiator.languages).toEqual(['en-US', 'en'])
            })

            it('should handle quality values', () => {
                const negotiator = new Negotiator({ 'accept-language': 'en-US;q=0.8, en' })
                expect(negotiator.languages).toEqual(['en', 'en-US'])
            })

            it('should handle wildcards', () => {
                const negotiator = new Negotiator({ 'accept-language': '*' })
                expect(negotiator.languages).toEqual(['*'])
            })

            it('should handle no accept-language header', () => {
                const negotiator = new Negotiator({})
                expect(negotiator.languages).toEqual(['*'])
            })
        })

        describe('.preferred_media_types()', () => {
            it('should return preferred media types', () => {
                const negotiator = new Negotiator({ 'accept': 'application/json, text/html' })
                expect(negotiator.preferred_media_types(['text/html', 'application/json'])).toEqual(['application/json', 'text/html'])
            })

            it('should handle quality values', () => {
                const negotiator = new Negotiator({ 'accept': 'application/json;q=0.8, text/html' })
                expect(negotiator.preferred_media_types(['text/html', 'application/json'])).toEqual(['text/html', 'application/json'])
            })

            it('should handle wildcards', () => {
                const negotiator = new Negotiator({ 'accept': 'text/*, application/json' })
                expect(negotiator.preferred_media_types(['text/plain', 'application/json'])).toEqual(['text/plain', 'application/json'])
            })

            it('should respect order of provided types for equal quality', () => {
                const negotiator = new Negotiator({ 'accept': 'text/html, application/json' })
                expect(negotiator.preferred_media_types(['application/json', 'text/html'])).toEqual(['text/html', 'application/json'])
            })

            it('should handle wildcard with equal quality', () => {
                const negotiator = new Negotiator({ 'accept': '*/*' })
                expect(negotiator.preferred_media_types(['text/html', 'application/json'])).toEqual(['text/html', 'application/json'])
            })
        })

        describe('.preferred_encodings()', () => {
            it('should return preferred encodings', () => {
                const negotiator = new Negotiator({ 'accept-encoding': 'gzip, deflate' })
                expect(negotiator.preferred_encodings(['deflate', 'gzip'])).toEqual(['gzip', 'deflate'])
            })

            it('should handle quality values', () => {
                const negotiator = new Negotiator({ 'accept-encoding': 'gzip;q=0.8, deflate' })
                expect(negotiator.preferred_encodings(['deflate', 'gzip'])).toEqual(['deflate', 'gzip'])
            })

            it('should handle wildcards', () => {
                const negotiator = new Negotiator({ 'accept-encoding': '*' })
                expect(negotiator.preferred_encodings(['gzip', 'deflate'])).toEqual(['gzip', 'deflate'])
            })
        })

        describe('.preferred_languages()', () => {
            it('should return preferred languages', () => {
                const negotiator = new Negotiator({ 'accept-language': 'en-US, en' })
                expect(negotiator.preferred_languages(['en', 'en-US'])).toEqual(['en-US', 'en'])
            })

            it('should handle quality values', () => {
                const negotiator = new Negotiator({ 'accept-language': 'en-US;q=0.8, en' })
                expect(negotiator.preferred_languages(['en', 'en-US'])).toEqual(['en', 'en-US'])
            })

            it('should handle wildcards', () => {
                const negotiator = new Negotiator({ 'accept-language': '*' })
                expect(negotiator.preferred_languages(['en-US', 'en'])).toEqual(['en-US', 'en'])
            })

            it('should handle language tags', () => {
                const negotiator = new Negotiator({ 'accept-language': 'en, fr' })
                expect(negotiator.preferred_languages(['en-US', 'fr-CH'])).toEqual(['en-US', 'fr-CH'])
            })
        })
    })
})
