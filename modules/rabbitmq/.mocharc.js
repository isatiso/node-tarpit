'use strict'

module.exports = {
    // Use ts-node to run TypeScript files
    require: [
        './test/helpers/mocha-hooks.ts'
    ],
    // Default timeout for individual tests
    timeout: '8000',
    // Increase timeout for slow tests (like container interactions)
    slow: '1500'
}
