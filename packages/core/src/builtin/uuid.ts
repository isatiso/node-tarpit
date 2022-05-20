/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import crypto from 'crypto'

/**
 * 内置的 UUID（通用唯一识别码）服务，版本为 Version 1 (date-time and MAC address)。
 *
 * @category Builtin
 */
export class UUID {

    private static random_8_pool = new Uint8Array(256) // # of random values to pre-allocate
    private static poolPtr = UUID.random_8_pool.length
    private static seed_bytes = UUID.rng()
    private static NODE_ID = [
        UUID.seed_bytes[0] | 0x01,
        UUID.seed_bytes[1],
        UUID.seed_bytes[2],
        UUID.seed_bytes[3],
        UUID.seed_bytes[4],
        UUID.seed_bytes[5],
    ]
    private static CLOCK_SEQ = ((UUID.seed_bytes[6] << 8) | UUID.seed_bytes[7]) & 0x3fff
    private static _lastMSecs = 0
    private static _lastNSecs = 0
    private static byteToHex = [
        '00', '01', '02', '03', '04', '05', '06', '07', '08', '09', '0a', '0b', '0c', '0d', '0e', '0f',
        '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '1a', '1b', '1c', '1d', '1e', '1f',
        '20', '21', '22', '23', '24', '25', '26', '27', '28', '29', '2a', '2b', '2c', '2d', '2e', '2f',
        '30', '31', '32', '33', '34', '35', '36', '37', '38', '39', '3a', '3b', '3c', '3d', '3e', '3f',
        '40', '41', '42', '43', '44', '45', '46', '47', '48', '49', '4a', '4b', '4c', '4d', '4e', '4f',
        '50', '51', '52', '53', '54', '55', '56', '57', '58', '59', '5a', '5b', '5c', '5d', '5e', '5f',
        '60', '61', '62', '63', '64', '65', '66', '67', '68', '69', '6a', '6b', '6c', '6d', '6e', '6f',
        '70', '71', '72', '73', '74', '75', '76', '77', '78', '79', '7a', '7b', '7c', '7d', '7e', '7f',
        '80', '81', '82', '83', '84', '85', '86', '87', '88', '89', '8a', '8b', '8c', '8d', '8e', '8f',
        '90', '91', '92', '93', '94', '95', '96', '97', '98', '99', '9a', '9b', '9c', '9d', '9e', '9f',
        'a0', 'a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'a7', 'a8', 'a9', 'aa', 'ab', 'ac', 'ad', 'ae', 'af',
        'b0', 'b1', 'b2', 'b3', 'b4', 'b5', 'b6', 'b7', 'b8', 'b9', 'ba', 'bb', 'bc', 'bd', 'be', 'bf',
        'c0', 'c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8', 'c9', 'ca', 'cb', 'cc', 'cd', 'ce', 'cf',
        'd0', 'd1', 'd2', 'd3', 'd4', 'd5', 'd6', 'd7', 'd8', 'd9', 'da', 'db', 'dc', 'dd', 'de', 'df',
        'e0', 'e1', 'e2', 'e3', 'e4', 'e5', 'e6', 'e7', 'e8', 'e9', 'ea', 'eb', 'ec', 'ed', 'ee', 'ef',
        'f0', 'f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7', 'f8', 'f9', 'fa', 'fb', 'fc', 'fd', 'fe', 'ff',
    ]

    private static rng() {
        if (UUID.poolPtr > UUID.random_8_pool.length - 16) {
            crypto.randomFillSync(UUID.random_8_pool)
            UUID.poolPtr = 0
        }
        return UUID.random_8_pool.slice(UUID.poolPtr, (UUID.poolPtr += 16))
    }

    private static stringify_long(arr: number[], offset = 0) {
        return (
            UUID.stringify_short(arr, 0) +
            UUID.byteToHex[arr[offset + 10]] +
            UUID.byteToHex[arr[offset + 11]] +
            UUID.byteToHex[arr[offset + 12]] +
            UUID.byteToHex[arr[offset + 13]] +
            UUID.byteToHex[arr[offset + 14]] +
            UUID.byteToHex[arr[offset + 15]]
        ).toLowerCase()
    }

    private static stringify_short(arr: number[], offset = 0) {
        return (
            UUID.byteToHex[arr[offset]] +
            UUID.byteToHex[arr[offset + 1]] +
            UUID.byteToHex[arr[offset + 2]] +
            UUID.byteToHex[arr[offset + 3]] +
            UUID.byteToHex[arr[offset + 4]] +
            UUID.byteToHex[arr[offset + 5]] +
            UUID.byteToHex[arr[offset + 6]] +
            UUID.byteToHex[arr[offset + 7]] +
            UUID.byteToHex[arr[offset + 8]] +
            UUID.byteToHex[arr[offset + 9]]
        ).toLowerCase()
    }

    private static _create() {
        let i = 0
        const b = new Array(10)
        let clock_sequence = UUID.CLOCK_SEQ
        let milli_secs = Date.now()
        let nano_secs = UUID._lastNSecs + 1
        const dt = milli_secs - UUID._lastMSecs + (nano_secs - UUID._lastNSecs) / 10000

        if (dt < 0) {
            clock_sequence = (clock_sequence + 1) & 0x3fff
        }

        if ((dt < 0 || milli_secs > UUID._lastMSecs)) {
            nano_secs = 0
        }

        if (nano_secs >= 10000) {
            throw new Error('Can\'t create more than 10M uuids/sec')
        }

        UUID._lastMSecs = milli_secs
        UUID._lastNSecs = nano_secs
        UUID.CLOCK_SEQ = clock_sequence

        milli_secs += 12219292800000

        const tl = ((milli_secs & 0xfffffff) * 10000 + nano_secs) % 0x100000000
        b[i++] = (tl >>> 24) & 0xff
        b[i++] = (tl >>> 16) & 0xff
        b[i++] = (tl >>> 8) & 0xff
        b[i++] = tl & 0xff

        const tmh = ((milli_secs / 0x100000000) * 10000) & 0xfffffff
        b[i++] = (tmh >>> 8) & 0xff
        b[i++] = tmh & 0xff

        b[i++] = ((tmh >>> 24) & 0xf) | 0x10
        b[i++] = (tmh >>> 16) & 0xff

        b[i++] = (clock_sequence >>> 8) | 0x80

        b[i++] = clock_sequence & 0xff

        return b
    }

    /**
     * 创建一个新的 uuid。
     *
     * > 返回值没有使用标准格式 `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`。
     * >
     * > 因为考虑多数情况会希望ID尽可能短, 所以返回格式直接去掉了所有的 `-`。
     *
     * @param type short 格式会去掉 node_id 部分。
     */
    create(type: 'short' | 'long' = 'long') {
        const b = UUID._create()
        if (type === 'short') {
            return UUID.stringify_short(b)
        } else {
            let node = UUID.NODE_ID
            const i = b.length
            for (let n = 0; n < 6; ++n) {
                b[i + n] = node[n]
            }
            return UUID.stringify_long(b)
        }
    }
}
