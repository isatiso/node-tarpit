#!/usr/bin/env node

import { createRequire } from 'module'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const require = createRequire(import.meta.url)

const pkg = require('../package.json')
const { create_cli } = await import('@tarpit/cli')

create_cli(pkg).catch(err => {
    console.error(err)
    process.exit(255)
})
