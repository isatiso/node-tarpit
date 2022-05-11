#!/usr/bin/env node

const pkg = require('@tarpit/cli/package.json')
const { create_cli } = require('@tarpit/cli')

create_cli(pkg).catch(err => {
    console.log(err)
    process.exit(255)
})
