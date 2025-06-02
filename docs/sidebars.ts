import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a "Next" and "Previous" navigation
 - automatically add a generated table of contents to a page
 */
const sidebars: SidebarsConfig = {
  // By default, Docusaurus generates a sidebar from the docs folder structure
  tutorialSidebar: [
    'intro',
    {
      type: 'category',
      label: 'Core Concepts',
      items: [
        'core/index',
        'core/dependency-injection',
        'core/platform-lifecycle',
        'core/providers',
        'core/decorators',
        'core/built-in-services',
      ],
    },
    {
      type: 'category',
      label: 'HTTP Server',
      items: [
        'http-server/index',
        'http-server/routing',
        'http-server/request-handling',
        'http-server/response-handling',
        'http-server/static-files',
      ],
    },
    {
      type: 'category',
      label: 'Schedule',
      items: [
        'schedule/index',
        // 'schedule/basic-usage', // TODO: Migrate when needed
      ],
    },
    {
      type: 'category',
      label: 'RabbitMQ Client',
      items: [
        'rabbitmq-client/index',
        // TODO: Add additional RabbitMQ pages when needed
        // 'rabbitmq-client/basic-usage',
        // 'rabbitmq-client/topology',
        // 'rabbitmq-client/acknowledgment',
      ],
    },
    {
      type: 'category',
      label: 'Content Type',
      items: [
        'content-type/index',
        // TODO: Add additional Content Type pages when needed
        // 'content-type/basic-usage',
        // 'content-type/url-encoding',
        // 'content-type/deserializers',
        // 'content-type/advanced-features',
      ],
    },
  ],

  // But you can create a sidebar manually
  /*
  tutorialSidebar: [
    'intro',
    'hello',
    {
      type: 'category',
      label: 'Tutorial',
      items: ['tutorial-basics/create-a-document'],
    },
  ],
   */
};

export default sidebars;
