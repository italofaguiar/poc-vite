interface ErrorMessageProps {
  /**
   * The error message to display
   */
  message: string
  /**
   * Optional className for custom styling
   */
  className?: string
}

/**
 * Reusable error message component with consistent styling.
 *
 * Displays error messages in a red-themed alert box with proper padding and styling.
 *
 * @example
 * ```tsx
 * <ErrorMessage message="Invalid email or password" />
 * ```
 */
function ErrorMessage({ message, className = '' }: ErrorMessageProps) {
  return (
    <div className={`rounded-md bg-red-50 p-4 ${className}`}>
      <p className="text-sm text-red-800">{message}</p>
    </div>
  )
}

export default ErrorMessage
