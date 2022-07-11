/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import chai, { expect } from 'chai'
import cap from 'chai-as-promised'
import { filter_provider } from './filter-provider'

chai.use(cap)

describe('filter-provider.ts', function() {

    describe('filter_provider()', function() {

        it('should filter out invalid value', function() {
            expect(filter_provider('asd')).to.eql([])
        })
    })
})
