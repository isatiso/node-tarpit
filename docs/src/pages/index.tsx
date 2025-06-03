import type { ReactNode } from 'react'
import Link from '@docusaurus/Link'
import useDocusaurusContext from '@docusaurus/useDocusaurusContext'
import Layout from '@theme/Layout'

function HomepageHeader() {
    const { siteConfig } = useDocusaurusContext()
    return (
            <header className="py-8 text-center relative overflow-hidden flex items-center justify-center flex-grow min-h-0 w-full lg:py-8 md:py-4  bg-orange-500/20">
                <div className="container">
                    <div className="mb-8">
                        <img
                                src="/img/tarpit-full.svg"
                                alt="Tarpit Logo"
                                className="max-w-md w-3/5 h-auto mb-4 mx-auto lg:max-w-lg md:max-w-sm md:w-3/5 sm:max-w-xs sm:w-2/3"
                        />
                    </div>
                    <p className="text-xl font-medium text-gray-800 dark:text-white mb-8">{siteConfig.tagline}</p>

                    {/* Badges Section */}
                    <div className="flex justify-center gap-2 flex-wrap my-8 lg:my-6 md:my-4">
                        <a
                                href="https://github.com/isatiso/node-tarpit/actions/workflows/ci.yml"
                                className="inline-block no-underline transition-all duration-200 ease-in-out rounded-md overflow-hidden hover:-translate-y-0.5 hover:opacity-90 hover:no-underline"
                                target="_blank"
                                rel="noopener noreferrer"
                        >
                            <img
                                    src="https://img.shields.io/github/check-runs/isatiso/node-tarpit/main"
                                    alt="Build Status"
                                    className="h-5 align-middle border-0 rounded-md shadow-sm transition-shadow duration-200 ease-in-out hover:shadow-md md:h-[18px] sm:h-4"
                            />
                        </a>
                        <a
                                href="https://codecov.io/gh/isatiso/node-tarpit"
                                className="inline-block no-underline transition-all duration-200 ease-in-out rounded-md overflow-hidden hover:-translate-y-0.5 hover:opacity-90 hover:no-underline"
                                target="_blank"
                                rel="noopener noreferrer"
                        >
                            <img
                                    src="https://codecov.io/gh/isatiso/node-tarpit/branch/main/graph/badge.svg?token=9S3UQPNS3Y"
                                    alt="Code Coverage"
                                    className="h-5 align-middle border-0 rounded-md shadow-sm transition-shadow duration-200 ease-in-out hover:shadow-md md:h-[18px] sm:h-4"
                            />
                        </a>
                        <a
                                href="https://github.com/isatiso/node-tarpit/blob/main/LICENSE"
                                className="inline-block no-underline transition-all duration-200 ease-in-out rounded-md overflow-hidden hover:-translate-y-0.5 hover:opacity-90 hover:no-underline"
                                target="_blank"
                                rel="noopener noreferrer"
                        >
                            <img
                                    src="https://img.shields.io/github/license/isatiso/node-tarpit"
                                    alt="MIT License"
                                    className="h-5 align-middle border-0 rounded-md shadow-sm transition-shadow duration-200 ease-in-out hover:shadow-md md:h-[18px] sm:h-4"
                            />
                        </a>
                        <a
                                href="https://www.npmjs.com/package/@tarpit/core"
                                className="inline-block no-underline transition-all duration-200 ease-in-out rounded-md overflow-hidden hover:-translate-y-0.5 hover:opacity-90 hover:no-underline"
                                target="_blank"
                                rel="noopener noreferrer"
                        >
                            <img
                                    src="https://img.shields.io/npm/dm/@tarpit/core"
                                    alt="Monthly Downloads"
                                    className="h-5 align-middle border-0 rounded-md shadow-sm transition-shadow duration-200 ease-in-out hover:shadow-md md:h-[18px] sm:h-4"
                            />
                        </a>
                        <a
                                href="https://nodejs.org/en/"
                                className="inline-block no-underline transition-all duration-200 ease-in-out rounded-md overflow-hidden hover:-translate-y-0.5 hover:opacity-90 hover:no-underline"
                                target="_blank"
                                rel="noopener noreferrer"
                        >
                            <img
                                    src="https://img.shields.io/node/v/@tarpit/core"
                                    alt="Node.js Version"
                                    className="h-5 align-middle border-0 rounded-md shadow-sm transition-shadow duration-200 ease-in-out hover:shadow-md md:h-[18px] sm:h-4"
                            />
                        </a>
                        <a
                                href="https://www.npmjs.com/package/@tarpit/core"
                                className="inline-block no-underline transition-all duration-200 ease-in-out rounded-md overflow-hidden hover:-translate-y-0.5 hover:opacity-90 hover:no-underline"
                                target="_blank"
                                rel="noopener noreferrer"
                        >
                            <img
                                    src="https://img.shields.io/npm/v/@tarpit/core"
                                    alt="NPM Version"
                                    className="h-5 align-middle border-0 rounded-md shadow-sm transition-shadow duration-200 ease-in-out hover:shadow-md md:h-[18px] sm:h-4"
                            />
                        </a>
                    </div>

                    <div className="flex items-center justify-center gap-4 flex-wrap mt-8">
                        <Link
                                className="inline-flex items-center px-6 py-3 text-lg font-semibold text-white bg-orange-500 hover:bg-orange-600 border border-orange-500 hover:border-orange-600 rounded-lg transition-colors duration-200 no-underline hover:no-underline"
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
