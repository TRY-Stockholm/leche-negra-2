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
    accent: '#d4a050',
    reelColor: '#e8b860',
    glow: 'rgba(212,160,80,0.5)',
    track: '/music/lofi-jazz.mp3',
  },
  midday: {
    id: 'midday',
    label: 'SUIYUE',
    sublabel: 'Side A — Midi',
    shell: '#1a2a18',
    accent: '#4ca85c',
    reelColor: '#5cdb6e',
    glow: 'rgba(76,201,92,0.5)',
    track: '/music/small-step.wav',
  },
  evening: {
    id: 'evening',
    label: 'ARABESQUE',
    sublabel: 'Side A — Le Soir',
    shell: '#2a0a12',
    accent: '#800020',
    reelColor: '#a01030',
    glow: 'rgba(128,0,32,0.45)',
    track: '/music/arabesque.mp3',
  },
  night: {
    id: 'night',
    label: 'SILICON',
    sublabel: 'Side A — Minuit',
    shell: '#1a0a2a',
    accent: '#6633cc',
    reelColor: '#9966ff',
    glow: 'rgba(102,51,204,0.45)',
    track: '/music/silicon.mp3',
  },
}

export const PERIODS: Record<string, PeriodInfo> = {
  morning: {
    label: 'Petit Dejeuner',
    subtitle: 'The golden hour',
    bgColor: '#1a1408',
    accentColor: '#d4a050',
    textColor: '#ffeedd',
    menuItems: ['Croissant au Beurre', 'Oeufs Brouillés', 'Tartine Confiture', 'Café Crème'],
  },
  midday: {
    label: 'Dejeuner',
    subtitle: 'High noon',
    bgColor: '#1a150a',
    accentColor: '#c9a84c',
    textColor: '#fffff0',
    menuItems: ['Salade Niçoise', 'Croque Monsieur', 'Soupe à l\'Oignon', 'Tarte Tatin'],
  },
  evening: {
    label: 'Diner',
    subtitle: 'Entre chien et loup',
    bgColor: '#1a0a0f',
    accentColor: '#800020',
    textColor: '#ffd4cc',
    menuItems: ['Steak Tartare', 'Bouillabaisse', 'Canard Confit', 'Crème Brûlée'],
  },
  night: {
    label: 'Nox Aeterna',
    subtitle: 'The witching hour',
    bgColor: '#0a0005',
    accentColor: '#c9a84c',
    textColor: '#e0d0ff',
    menuItems: ['Negroni', 'Martini', 'Champagne', 'Espresso'],
  },
}

export const SPEAKER_COLORS: Record<string, { speaker: string; glow: string; eq: string }> = {
  morning: { speaker: '#d4a050', glow: 'rgba(212,160,80,0.5)', eq: '#e8b860' },
  midday: { speaker: '#c9a84c', glow: 'rgba(201,168,76,0.5)', eq: '#dbb85c' },
  evening: { speaker: '#800020', glow: 'rgba(128,0,32,0.45)', eq: '#a01030' },
  night: { speaker: '#6633cc', glow: 'rgba(102,51,204,0.45)', eq: '#9966ff' },
}
