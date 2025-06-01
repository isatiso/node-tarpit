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
    // TODO: Add other modules as we migrate them
    // {
    //   type: 'category',
    //   label: 'HTTP Server',
    //   items: [
    //     'http-server/index',
    //   ],
    // },
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
