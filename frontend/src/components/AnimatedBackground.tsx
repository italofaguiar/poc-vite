interface AnimatedBackgroundProps {
  /**
   * Optional className for additional styling
   */
  className?: string;
}

/**
 * Animated radial gradient background with pulsing effect
 * Inspired by pilotodevendas.com.br hero section
 */
export function AnimatedBackground({ className = '' }: AnimatedBackgroundProps) {
  return (
    <div
      className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}
      aria-hidden="true"
    >
      {/* Primary pulse - larger, slower */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] animate-pulse-radial">
        <div className="w-full h-full rounded-full bg-gradient-radial from-primary/30 via-primary/15 to-transparent blur-3xl" />
      </div>

      {/* Secondary pulse - smaller, offset */}
      <div className="absolute top-1/3 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] animate-pulse-radial-delayed">
        <div className="w-full h-full rounded-full bg-gradient-radial from-primary/25 via-primary/10 to-transparent blur-2xl" />
      </div>

      {/* Tertiary accent */}
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] animate-pulse-radial-slow">
        <div className="w-full h-full rounded-full bg-gradient-radial from-primary/20 to-transparent blur-3xl" />
      </div>
    </div>
  );
}
