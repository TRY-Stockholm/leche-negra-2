import { motion, AnimatePresence } from 'motion/react'
import { TAPES, PERIODS } from './types'
import { useTapeDeck } from './TapeDeckContext'

export function NowPlaying({
  className,
  style,
}: {
  className?: string
  style?: React.CSSProperties
}) {
  const { loadedTapeId, playing } = useTapeDeck()

  const activeTape = loadedTapeId ? TAPES[loadedTapeId] : null
  const period = activeTape ? PERIODS[activeTape.id] : null

  return (
    <div className={className} style={style}>
      <AnimatePresence mode="wait">
        {period && activeTape && playing ? (
          <motion.div
            key={activeTape.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
          >
            <p className="text-[9px] tracking-[0.3em] uppercase mb-1" style={{ color: activeTape.accent + '80' }}>Now Playing</p>
            <p className="text-lg tracking-[0.15em] uppercase" style={{ color: period.accentColor, fontFamily: 'Georgia, serif' }}>{period.label}</p>
            <p className="text-xs mt-1 tracking-wider" style={{ color: period.textColor + '80' }}>{period.subtitle}</p>
            <div className="flex flex-col gap-1 mt-3">
              {period.menuItems.map(item => (
                <span key={item} className="text-[10px] tracking-wide" style={{ color: period.textColor + '50' }}>{item}</span>
              ))}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
