/**
 * Theme utility for accessing CSS variables in TypeScript
 * This ensures consistent use of design tokens across the application
 */

export const theme = {
  // Primary colors
  colors: {
    primary: 'var(--color-primary)',
    primaryHover: 'var(--color-primaryHover)',
    primaryLight: 'var(--color-primaryLight)',
    primaryDark: 'var(--color-primaryDark)',

    // Backgrounds
    bgBase: 'var(--color-bgBase)',
    bgDark: 'var(--color-bgDark)',
    bgCard: 'var(--color-bgCard)',
    bgCardHover: 'var(--color-bgCardHover)',
    bgSidebar: 'var(--color-bgSidebar)',
    bgInput: 'var(--color-bgInput)',

    // Borders
    border: 'var(--color-border)',
    borderLight: 'var(--color-borderLight)',
    borderHover: 'var(--color-borderHover)',

    // Text
    textPrimary: 'var(--color-textPrimary)',
    textSecondary: 'var(--color-textSecondary)',
    textMuted: 'var(--color-textMuted)',
    textDim: 'var(--color-textDim)',
    textSubtle: 'var(--color-textSubtle)',

    // Accents - Success
    success: 'var(--color-success)',
    successHover: 'var(--color-successHover)',
    successLight: 'var(--color-successLight)',
    successBg: 'var(--color-successBg)',
    successBorder: 'var(--color-successBorder)',

    // Accents - Danger
    danger: 'var(--color-danger)',
    dangerHover: 'var(--color-dangerHover)',
    dangerLight: 'var(--color-dangerLight)',
    dangerBg: 'var(--color-dangerBg)',
    dangerBorder: 'var(--color-dangerBorder)',

    // Accents - Warning
    warning: 'var(--color-warning)',
    warningHover: 'var(--color-warningHover)',
    warningLight: 'var(--color-warningLight)',
    warningBg: 'var(--color-warningBg)',

    // Accents - Info
    info: 'var(--color-info)',
    infoHover: 'var(--color-infoHover)',
    infoLight: 'var(--color-infoLight)',
    infoBg: 'var(--color-infoBg)',

    // Chart colors
    chartPrimary: 'var(--color-chartPrimary)',
    chartPrimaryBorder: 'var(--color-chartPrimaryBorder)',
    chartGrid: 'var(--color-chartGrid)',
    chartText: 'var(--color-chartText)',
    chartTextDim: 'var(--color-chartTextDim)',
  },

  shadows: {
    sm: 'var(--shadow-sm)',
    md: 'var(--shadow-md)',
    lg: 'var(--shadow-lg)',
    xl: 'var(--shadow-xl)',
    primary: 'var(--shadow-primary)',
  },
};

/**
 * Common style objects for reusability
 */
export const commonStyles = {
  card: {
    backgroundColor: theme.colors.bgCard,
    border: `1px solid ${theme.colors.border}`,
    boxShadow: theme.shadows.xl,
  },

  input: {
    backgroundColor: theme.colors.bgInput,
    border: `1px solid ${theme.colors.border}`,
    color: theme.colors.textSecondary,
  },

  button: {
    primary: {
      backgroundColor: theme.colors.primary,
      color: theme.colors.textPrimary,
    },
    secondary: {
      backgroundColor: theme.colors.bgInput,
      color: theme.colors.textMuted,
      border: `1px solid ${theme.colors.border}`,
    },
  },

  badge: {
    success: {
      backgroundColor: theme.colors.successBg,
      color: theme.colors.successLight,
      border: `1px solid ${theme.colors.successBorder}`,
    },
    danger: {
      backgroundColor: theme.colors.dangerBg,
      color: theme.colors.dangerLight,
      border: `1px solid ${theme.colors.dangerBorder}`,
    },
    warning: {
      backgroundColor: theme.colors.warningBg,
      color: theme.colors.warningLight,
    },
    info: {
      backgroundColor: theme.colors.infoBg,
      color: theme.colors.infoLight,
    },
  },
};
