export const theme = {
  colors: {
    orange: '#FD5901',
    navy: '#08006C',
    white: '#FFFFFF',
    canvas: '#F6F7FB',
    border: '#E4E6F0',
    muted: '#626782',
    navySoft: '#EFEEFF',
    orangeSoft: '#FFF0E8',
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
  },
  radius: {
    sm: '0.5rem',
    md: '0.875rem',
    lg: '1.25rem',
  },
  shadow: {
    card: '0 16px 40px rgba(8, 0, 108, 0.08)',
    floating: '0 20px 55px rgba(8, 0, 108, 0.16)',
  },
}

export function applyTheme(root = document.documentElement) {
  root.style.setProperty('--color-orange', theme.colors.orange)
  root.style.setProperty('--color-navy', theme.colors.navy)
  root.style.setProperty('--color-white', theme.colors.white)
  root.style.setProperty('--color-canvas', theme.colors.canvas)
  root.style.setProperty('--color-border', theme.colors.border)
  root.style.setProperty('--color-muted', theme.colors.muted)
  root.style.setProperty('--color-navy-soft', theme.colors.navySoft)
  root.style.setProperty('--color-orange-soft', theme.colors.orangeSoft)
  root.style.setProperty('--radius-sm', theme.radius.sm)
  root.style.setProperty('--radius-md', theme.radius.md)
  root.style.setProperty('--radius-lg', theme.radius.lg)
  root.style.setProperty('--shadow-card', theme.shadow.card)
  root.style.setProperty('--shadow-floating', theme.shadow.floating)
}
