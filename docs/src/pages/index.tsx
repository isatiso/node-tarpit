import type { ReactNode } from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

import styles from './index.module.css';

function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <div className={styles.logoContainer}>
          <img
            src="/img/tarpit-full.svg"
            alt="Tarpit Logo"
            className={styles.heroLogo}
          />
        </div>
        <p className="hero__subtitle">{siteConfig.tagline}</p>

        {/* Badges Section */}
        <div className={styles.badgesContainer}>
          <div className={styles.badgeRow}>
            <a href="https://github.com/isatiso/node-tarpit/actions/workflows/ci.yml" className={styles.badgeLink} target="_blank" rel="noopener noreferrer"            >
              <img src="https://img.shields.io/github/check-runs/isatiso/node-tarpit/main" alt="Build Status" className={styles.badge} />
            </a>
            <a href="https://codecov.io/gh/isatiso/node-tarpit" className={styles.badgeLink} target="_blank" rel="noopener noreferrer"            >
              <img src="https://codecov.io/gh/isatiso/node-tarpit/branch/main/graph/badge.svg?token=9S3UQPNS3Y" alt="Code Coverage" className={styles.badge} />
            </a>
            <a href="https://github.com/isatiso/node-tarpit/blob/main/LICENSE" className={styles.badgeLink} target="_blank" rel="noopener noreferrer"            >
              <img src="https://img.shields.io/github/license/isatiso/node-tarpit" alt="MIT License" className={styles.badge} />
            </a>
            <a href="https://www.npmjs.com/package/@tarpit/core" className={styles.badgeLink} target="_blank" rel="noopener noreferrer"            >
              <img src="https://img.shields.io/npm/dm/@tarpit/core" alt="Monthly Downloads" className={styles.badge} />
            </a>
            <a href="https://nodejs.org/en/" className={styles.badgeLink} target="_blank" rel="noopener noreferrer"            >
              <img src="https://img.shields.io/node/v/@tarpit/core" alt="Node.js Version" className={styles.badge} />
            </a>
            <a href="https://www.npmjs.com/package/@tarpit/core" className={styles.badgeLink} target="_blank" rel="noopener noreferrer"            >
              <img src="https://img.shields.io/npm/v/@tarpit/core" alt="NPM Version" className={styles.badge} />
            </a>
          </div>
        </div>

        <div className={styles.buttons}>
          <Link
            className="button button--secondary button--lg"
            to="/docs/intro">
            Get Started →
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function Home(): ReactNode {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout
      title={`${siteConfig.title} - Simple but Awesome TypeScript DI Framework`}
      description="Simple but Awesome TypeScript DI Framework for Node.js"
      wrapperClassName="homepage">
      <main>
        <HomepageHeader />
      </main>
    </Layout>
  );
}
