/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      './src/**/*.{js,jsx,ts,tsx}',   // 默认内容目录
      './docs/**/*.{md,mdx}',         // 支持 md/mdx 文件中使用 class
      './blog/**/*.{md,mdx}',         // 如果你启用了博客
      './docusaurus.config.js',       // 需要时也可加入
    ],
    darkMode: ['selector', '[data-theme="dark"]'],
    theme: {
      extend: {},
    },
    plugins: [],
  }