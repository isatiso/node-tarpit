import * as crypto from 'crypto'
import * as fs from 'fs'
import * as path from 'path'

import * as core from '@actions/core'
import * as openpgp from 'openpgp'
import * as fetch from 'node-fetch'

import { get_base_url, set_failure } from './helpers'

async function verify(filename: string, platform: string, version: string, verbose: boolean, failCi: boolean): Promise<void> {
    try {
        const uploader_name = 'codecov'

        // Read in public key
        const public_key_armored = fs.readFileSync(path.join(__dirname, 'pgp_keys.asc'), 'utf-8')

        // Get SHASUM and SHASUM signature files
        console.log(`${get_base_url(platform, version)}.SHA256SUM`)
        const shasumRes = await fetch.default(
            `${get_base_url(platform, version)}.SHA256SUM`,
        )
        const shasum = await shasumRes.text()
        if (verbose) {
            console.log(`Received SHA256SUM ${shasum}`)
        }

        const shaSigRes = await fetch.default(
            `${get_base_url(platform, version)}.SHA256SUM.sig`,
        )
        const shaSig = await shaSigRes.text()
        if (verbose) {
            console.log(`Received SHA256SUM signature ${shaSig}`)
        }

        // Verify shasum
        const verified = await openpgp.verify({
            message: await openpgp.createMessage({ text: shasum }),
            signature: await openpgp.readSignature({ armoredSignature: shaSig }),
            verificationKeys: await openpgp.readKeys({ armoredKeys: public_key_armored }),
        })
        const valid = await verified.signatures[0].verified
        if (valid) {
            core.info('==> SHASUM file signed by key id ' +
                verified.signatures[0].keyID.toHex(),
            )
        } else {
            set_failure('Codecov: Error validating SHASUM signature', failCi)
        }

        const calculateHash = async (filename: string) => {
            const stream = fs.createReadStream(filename)
            const uploaderSha = crypto.createHash(`sha256`)
            stream.pipe(uploaderSha)

            return new Promise((resolve, reject) => {
                stream.on('end', () => resolve(
                    `${uploaderSha.digest('hex')}  ${uploader_name}`,
                ))
                stream.on('error', reject)
            })
        }

        const hash = await calculateHash(filename)
        if (hash === shasum) {
            core.info(`==> Uploader SHASUM verified (${hash})`)
        } else {
            set_failure(
                'Codecov: Uploader shasum does not match -- ' +
                `uploader hash: ${hash}, public hash: ${shasum}`,
                failCi,
            )
        }
    } catch (err) {
        set_failure(`Codecov: Error validating uploader: ${err.message}`, failCi)
    }
}

export default verify
