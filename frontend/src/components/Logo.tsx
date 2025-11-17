import { Link } from 'react-router-dom';

interface LogoProps {
  /**
   * Variant of the logo
   * - full: Emoji + full text "PilotoDeVendas.IA"
   * - compact: Emoji + "PilotoDeVendas"
   */
  variant?: 'full' | 'compact';
  /**
   * Size of the logo
   * - sm: Small (for mobile/compact spaces)
   * - md: Medium (default, for headers)
   * - lg: Large (for hero sections)
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Optional link destination
   */
  linkTo?: string;
  /**
   * Optional className for additional styling
   */
  className?: string;
}

export function Logo({
  variant = 'full',
  size = 'md',
  linkTo,
  className = ''
}: LogoProps) {
  const sizeClasses = {
    sm: 'text-xl gap-1.5',
    md: 'text-2xl gap-2',
    lg: 'text-3xl md:text-4xl gap-2.5',
  };

  const emojiSizes = {
    sm: 'text-2xl',
    md: 'text-3xl',
    lg: 'text-4xl md:text-5xl',
  };

  const text = variant === 'full' ? 'PilotoDeVendas.IA' : 'PilotoDeVendas';

  const content = (
    <div
      className={`
        flex items-center font-bold
        ${sizeClasses[size]}
        ${className}
      `}
    >
      <span className={emojiSizes[size]} role="img" aria-label="Robot">
        🤖
      </span>
      <span className="text-primary dark:text-primary font-headline tracking-tight">
        {text}
      </span>
    </div>
  );

  if (linkTo) {
    return (
      <Link
        to={linkTo}
        className="inline-block hover:opacity-80 transition-opacity"
      >
        {content}
      </Link>
    );
  }

  return content;
}
