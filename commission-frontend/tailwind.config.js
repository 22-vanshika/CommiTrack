/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
colors: {
        // Primary
        primary: {
          DEFAULT: 'var(--color-primary)',
          hover: 'var(--color-primaryHover)',
          light: 'var(--color-primaryLight)',
          dark: 'var(--color-primaryDark)',
          bg: 'var(--color-primaryBg)',
        },
        
        // Custom background colors
        bgbase: 'var(--color-bgBase)',
        bgdark: 'var(--color-bgDark)',
        bgcard: 'var(--color-bgCard)',
        bgcardhover: 'var(--color-bgCardHover)',
        bgsidebar: 'var(--color-bgSidebar)',
        bginput: 'var(--color-bgInput)',
        
        // Borders  
        borderdefault: 'var(--color-border)',
        borderlight: 'var(--color-borderLight)',
        borderhover: 'var(--color-borderHover)',
        
        // Text colors
        textprimary: 'var(--color-textPrimary)',
        textsecondary: 'var(--color-textSecondary)',
        textmuted: 'var(--color-textMuted)',
        textdim: 'var(--color-textDim)',
        textsubtl: 'var(--color-textSubtle)',
        
        // Success
        success: {
          DEFAULT: 'var(--color-success)',
          hover: 'var(--color-successHover)',
          light: 'var(--color-successLight)',
          bg: 'var(--color-successBg)',
          border: 'var(--color-successBorder)',
        },
        
        // Danger
        danger: {
          DEFAULT: 'var(--color-danger)',
          hover: 'var(--color-dangerHover)',
          light: 'var(--color-dangerLight)',
          bg: 'var(--color-dangerBg)',
          border: 'var(--color-dangerBorder)',
        },
        
        // Warning
        warning: {
          DEFAULT: 'var(--color-warning)',
          hover: 'var(--color-warningHover)',
          light: 'var(--color-warningLight)',
          bg: 'var(--color-warningBg)',
        },
        
        // Info
        info: {
          DEFAULT: 'var(--color-info)',
          hover: 'var(--color-infoHover)',
          light: 'var(--color-infoLight)',
          bg: 'var(--color-infoBg)',
        },
      },
      boxShadow: {
        'custom-sm': 'var(--shadow-sm)',
        'custom-md': 'var(--shadow-md)',
        'custom-lg': 'var(--shadow-lg)',
        'custom-xl': 'var(--shadow-xl)',
        'custom-primary': 'var(--shadow-primary)',
      },
    },
  },
  plugins: [],
}

