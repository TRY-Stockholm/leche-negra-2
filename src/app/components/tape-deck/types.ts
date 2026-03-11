export type TapeConfig = {
  id: string
  label: string
  sublabel: string
  shell: string
  accent: string
  reelColor: string
  glow: string
  track: string
}

export type PeriodInfo = {
  label: string
  subtitle: string
  bgColor: string
  accentColor: string
  textColor: string
  menuItems: string[]
}

export const TAPES: Record<string, TapeConfig> = {
  morning: {
    id: 'morning',
    label: 'LOFI JAZZ',
    sublabel: 'Side A — Le Matin',
    shell: '#3d2b1a',
    accent: '#c9a96e',
    reelColor: '#d4b87a',
    glow: 'rgba(201,169,110,0.5)',
    track: '/music/lofi-jazz.mp3',
  },
  midday: {
    id: 'midday',
    label: 'SUIYUE',
    sublabel: 'Side A — Midi',
    shell: '#2a1f14',
    accent: '#b8774a',
    reelColor: '#c98a5a',
    glow: 'rgba(184,119,74,0.45)',
    track: '/music/suiyue.mp3',
  },
  evening: {
    id: 'evening',
    label: 'ARABESQUE',
    sublabel: 'Side A — Le Soir',
    shell: '#2a0a12',
    accent: '#8b2236',
    reelColor: '#a33048',
    glow: 'rgba(139,34,54,0.45)',
    track: '/music/arabesque.mp3',
  },
  night: {
    id: 'night',
    label: 'SILICON',
    sublabel: 'Side A — Minuit',
    shell: '#1a1210',
    accent: '#6b4a3a',
    reelColor: '#7a5a48',
    glow: 'rgba(107,74,58,0.4)',
    track: '/music/silicon.mp3',
  },
}

export const PERIODS: Record<string, PeriodInfo> = {
  morning: {
    label: 'Petit Dejeuner',
    subtitle: 'The golden hour',
    bgColor: '#1a1408',
    accentColor: '#c9a96e',
    textColor: '#ffeedd',
    menuItems: ['Croissant au Beurre', 'Oeufs Brouillés', 'Tartine Confiture', 'Café Crème'],
  },
  midday: {
    label: 'Dejeuner',
    subtitle: 'High noon',
    bgColor: '#1a150a',
    accentColor: '#b8774a',
    textColor: '#fffff0',
    menuItems: ['Salade Niçoise', 'Croque Monsieur', 'Soupe à l\'Oignon', 'Tarte Tatin'],
  },
  evening: {
    label: 'Diner',
    subtitle: 'Entre chien et loup',
    bgColor: '#1a0a0f',
    accentColor: '#8b2236',
    textColor: '#ffd4cc',
    menuItems: ['Steak Tartare', 'Bouillabaisse', 'Canard Confit', 'Crème Brûlée'],
  },
  night: {
    label: 'Nox Aeterna',
    subtitle: 'The witching hour',
    bgColor: '#0f0a08',
    accentColor: '#6b4a3a',
    textColor: '#d4c9bc',
    menuItems: ['Negroni', 'Martini', 'Champagne', 'Espresso'],
  },
}

export const SPEAKER_COLORS: Record<string, { speaker: string; glow: string; eq: string }> = {
  morning: { speaker: '#c9a96e', glow: 'rgba(201,169,110,0.5)', eq: '#d4b87a' },
  midday: { speaker: '#b8774a', glow: 'rgba(184,119,74,0.45)', eq: '#c98a5a' },
  evening: { speaker: '#8b2236', glow: 'rgba(139,34,54,0.45)', eq: '#a33048' },
  night: { speaker: '#6b4a3a', glow: 'rgba(107,74,58,0.4)', eq: '#7a5a48' },
}
