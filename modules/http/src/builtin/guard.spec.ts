/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { Judgement } from '@tarpit/judge'
import { describe, expect, it } from 'vitest'
import { Guard } from './guard'

describe('guard.ts', function() {

    describe('Guard', function() {

        it('should new instance', function() {
            const instance = new Guard({ type: 'basic', credentials: 'YWxhZGRpbjpvcGVuc2VzYW1l' })
            expect(instance).toBeInstanceOf(Judgement)
            expect(instance.data).toEqual({ type: 'basic', credentials: 'YWxhZGRpbjpvcGVuc2VzYW1l' })
        })

        describe('#on_error()', function() {

            it('should be called when judgement not match', function() {
                const instance = new Guard({ type: 'basic', credentials: 'YWxhZGRpbjpvcGVuc2VzYW1l' })
                expect(() => instance.ensure('type', /^basic$/)).not.toThrow()
                expect(() => instance.ensure('type', /^bearer$/)).toThrow('Token field [type] does not match the rule: [RegExp ^bearer$]')
            })

            it('should be use custom on_error function if given', function() {
                const instance = new Guard({ type: 'basic', credentials: 'YWxhZGRpbjpvcGVuc2VzYW1l' })
                expect(() => instance.ensure('type', /^user$/, (prop, desc) => `${prop} -> ${desc.rule}`))
                    .toThrow('type -> RegExp ^user$')
            })
        })
    })
})
