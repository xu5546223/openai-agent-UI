/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}", // 涵蓋 src 下所有子目錄
  ],
  theme: {
    extend: {
      colors: {
        // 您可以在這裡定義自訂顏色
        // primary: '#3b82f6', 
      },
      spacing: {
        // 您可以在這裡定義自訂間距
      },
      // ... 其他 theme 擴展
    },
  },
  plugins: [
    require('@tailwindcss/forms'), // 如果您使用表單元素，可以考慮加入
    // ... 其他插件
  ],
} 