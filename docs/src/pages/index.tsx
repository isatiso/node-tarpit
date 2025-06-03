import type { ReactNode } from 'react'
import Link from '@docusaurus/Link'
import useDocusaurusContext from '@docusaurus/useDocusaurusContext'
import Layout from '@theme/Layout'

function HomepageHeader() {
    const { siteConfig } = useDocusaurusContext()
    return (
            <header className="py-8 text-center relative overflow-hidden flex items-center justify-center flex-grow min-h-0 w-full lg:py-8 md:py-4 bg-orange-500/10">
                <div className="container">
                    <div className="mb-8">
                        <img src="/img/tarpit-full.svg" alt="Tarpit Logo"
                             className="max-w-md w-3/5 h-auto mb-4 mx-auto lg:max-w-lg md:max-w-sm md:w-3/5 sm:max-w-xs sm:w-2/3"
                        />
                    </div>
                    <p className="text-xl font-medium text-gray-800 dark:text-white mb-8">{siteConfig.tagline}</p>

                    {/* Badges Section */}
                    <div className="flex flex-col items-center gap-3 my-8 lg:my-6 md:my-4">
                        {/* Metrics Badges Row (with numbers) */}
                        <div className="flex justify-center gap-2 flex-wrap">
                            <a href="https://www.npmjs.com/package/@tarpit/core" target="_blank" rel="noopener noreferrer">
                                <img src="https://img.shields.io/npm/v/@tarpit/core" alt="NPM Version"/>
                            </a>
                            <a href="https://www.npmjs.com/package/@tarpit/core" target="_blank" rel="noopener noreferrer">
                                <img src="https://img.shields.io/npm/dm/@tarpit/core" alt="Monthly Downloads"/>
                            </a>
                            <a href="https://nodejs.org/en/" target="_blank" rel="noopener noreferrer">
                                <img src="https://img.shields.io/node/v/@tarpit/core" alt="Node.js Version"/>
                            </a>
                            <a href="https://codecov.io/gh/isatiso/node-tarpit" target="_blank" rel="noopener noreferrer">
                                <img src="https://codecov.io/gh/isatiso/node-tarpit/branch/main/graph/badge.svg?token=9S3UQPNS3Y" alt="Code Coverage"/>
                            </a>
                            <a href="https://bundlephobia.com/package/@tarpit/core" target="_blank" rel="noopener noreferrer">
                                <img src="https://img.shields.io/bundlephobia/minzip/@tarpit/core" alt="Bundle Size"/>
                            </a>
                            <a href="https://github.com/isatiso/node-tarpit/commits/main" target="_blank" rel="noopener noreferrer">
                                <img src="https://img.shields.io/github/last-commit/isatiso/node-tarpit" alt="Last Commit"/>
                            </a>
                        </div>
                        
                        {/* Status/Identity Badges Row (without numbers) */}
                        <div className="flex justify-center gap-2 flex-wrap">
                            <a href="https://github.com/isatiso/node-tarpit/actions/workflows/ci.yml" target="_blank" rel="noopener noreferrer">
                                <img src="https://img.shields.io/github/check-runs/isatiso/node-tarpit/main" alt="Build Status"/>
                            </a>
                            <a href="https://github.com/isatiso/node-tarpit" target="_blank" rel="noopener noreferrer">
                                <img src="https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white" alt="TypeScript"/>
                            </a>
                            <a href="https://github.com/isatiso/node-tarpit/blob/main/LICENSE" target="_blank" rel="noopener noreferrer">
                                <img src="https://img.shields.io/github/license/isatiso/node-tarpit" alt="MIT License"/>
                            </a>
                            <a href="https://lerna.js.org/" target="_blank" rel="noopener noreferrer">
                                <img src="https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg" alt="Lerna"/>
                            </a>
                            <a href="https://deepwiki.com/isatiso/node-tarpit" target="_blank" rel="noopener noreferrer">
                                <img src="https://deepwiki.com/badge.svg" alt="Ask DeepWiki"/>
                            </a>
                        </div>
                        
                        {/* Social Badges Row */}
                        <div className="flex justify-center gap-3">
                            <a href="https://github.com/isatiso/node-tarpit" target="_blank" rel="noopener noreferrer">
                                <img src="https://img.shields.io/github/stars/isatiso/node-tarpit?style=social" alt="GitHub Stars"/>
                            </a>
                            <a href="https://github.com/isatiso/node-tarpit/network/members" target="_blank" rel="noopener noreferrer">
                                <img src="https://img.shields.io/github/forks/isatiso/node-tarpit?style=social" alt="GitHub Forks"/>
                            </a>
                        </div>
                    </div>

                    <div className="flex items-center justify-center gap-4 flex-wrap mt-8">
                        <Link
                                className="inline-flex items-center px-6 py-3 text-lg font-semibold text-white bg-orange-500 hover:bg-orange-600 border rounded-lg transition-colors duration-200 no-underline hover:no-underline"
                                to="/docs/intro">
                            Get Started →
                        </Link>
                    </div>
                </div>
            </header>
    )
}

export default function Home(): ReactNode {
    const { siteConfig } = useDocusaurusContext()
    return (
            <Layout
                    title={`${siteConfig.title} - Simple but Awesome TypeScript DI Framework`}
                    description="Simple but Awesome TypeScript DI Framework for Node.js"
                    wrapperClassName="homepage">
                <main>
                    <HomepageHeader/>
                </main>
            </Layout>
    )
}
