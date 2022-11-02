import * as core from '@actions/core'
import axios from 'axios'
import crypto from 'crypto'
import fs from 'fs'
import * as openpgp from 'openpgp'
import path from 'path'

import { get_base_url, set_failure } from './helpers'

async function verify(filename: string, platform: string, version: string): Promise<void> {
    try {
        const uploader_name = 'codecov'

        const public_key = fs.readFileSync(path.join(path.dirname(__dirname), 'pgp_keys.asc'), 'utf-8')

        const base_url = get_base_url(platform, version)
        console.log(base_url + '.SHA256SUM')

        const check_sum = await axios.get<string>(base_url + '.SHA256SUM', { responseType: 'text' }).then(res => res.data)
        console.log(`Received SHA256SUM ${check_sum}`)

        const sign = await axios.get<string>(base_url + '.SHA256SUM.sig', { responseType: 'text' }).then(res => res.data)
        console.log(`Received SHA256SUM signature ${sign}`)

        const verified = await openpgp.verify({
            message: await openpgp.createMessage({ text: check_sum }),
            signature: await openpgp.readSignature({ armoredSignature: sign }),
            verificationKeys: await openpgp.readKeys({ armoredKeys: public_key }),
        })
        const valid = await verified.signatures[0].verified
        if (valid) {
            core.info('==> SHA256SUM file signed by key id ' + verified.signatures[0].keyID.toHex())
        } else {
            set_failure('Codecov: Error validating SHA256SUM signature')
        }

        function calculate_hash(filename: string) {
            const sha256 = crypto.createHash(`sha256`)
                .update(fs.readFileSync(filename))
                .digest('hex')
            return sha256 + ' ' + uploader_name
        }

        const hash = calculate_hash(filename)
        if (hash === check_sum) {
            core.info(`==> Uploader SHA256SUM verified (${hash})`)
        } else {
            set_failure(`Codecov: SHA256SUM does not match -- uploader: ${hash}, public: ${check_sum}`)
        }
    } catch (err: any) {
        set_failure(`Codecov: Error validating uploader: ${err.message}`)
    }
}

export default verify
