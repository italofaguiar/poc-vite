import { Logo } from './Logo';
import { AnimatedBackground } from './AnimatedBackground';

interface HeroSectionProps {
  /**
   * Main tagline/title
   */
  title: string;
  /**
   * Optional subtitle/description
   */
  subtitle?: string;
  /**
   * Show animated background
   */
  showAnimation?: boolean;
  /**
   * Optional className for additional styling
   */
  className?: string;
}

/**
 * Hero section component for auth pages
 * Features logo, tagline, and animated background
 */
export function HeroSection({
  title,
  subtitle,
  showAnimation = true,
  className = ''
}: HeroSectionProps) {
  return (
    <div className={`relative flex flex-col items-center justify-center p-8 md:p-12 lg:p-16 ${className}`}>
      {/* Animated Background */}
      {showAnimation && <AnimatedBackground />}

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center space-y-6 max-w-2xl">
        {/* Logo */}
        <Logo variant="full" size="lg" />

        {/* Tagline */}
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-app-primary dark:text-dark-app-primary leading-tight">
          {title}
        </h1>

        {/* Subtitle/Description */}
        {subtitle && (
          <p className="text-lg md:text-xl text-app-secondary dark:text-dark-app-secondary max-w-xl leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
