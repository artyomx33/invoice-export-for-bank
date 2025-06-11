/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // or 'media' or 'class'
  theme: {
    extend: {
      colors: {
        // Example custom colors - can be expanded based on design
        // These are just examples, the primary colors will come from CSS variables
        // or default Tailwind palette if not overridden here.
        primary: 'var(--primary)',
        secondary: 'var(--secondary)',
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        card: 'var(--card)',
        'card-foreground': 'var(--card-foreground)',
        // Add other custom colors as needed
      },
      borderRadius: {
        lg: `var(--radius)`,
        md: `calc(var(--radius) - 2px)`,
        sm: `calc(var(--radius) - 4px)`,
      },
      // Add other theme extensions if needed
    },
  },
  plugins: [
    // require('@tailwindcss/forms'), // Example plugin, uncomment if needed
    // require('@tailwindcss/typography'), // Example plugin, uncomment if needed
  ],
}
