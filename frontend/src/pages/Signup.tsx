import { useState, FormEvent, ChangeEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { signup } from '../services/api'
import { createSignupSchema } from '../schemas/auth'
import { ZodError } from 'zod'
import { getErrorMessage } from '../types'
import ErrorMessage from '../components/ErrorMessage'
import { HeroSection } from '../components/HeroSection'
import { AnimatedBackground } from '../components/AnimatedBackground'
import { LanguageToggle } from '../components/LanguageToggle'

function Signup() {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [emailError, setEmailError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [generalError, setGeneralError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    // Clear previous errors
    setEmailError('')
    setPasswordError('')
    setGeneralError('')

    // Validate with Zod
    try {
      createSignupSchema(t).parse({ email, password })
    } catch (err) {
      if (err instanceof ZodError) {
        // Map Zod errors to field-specific error states
        err.errors.forEach((error) => {
          if (error.path[0] === 'email') {
            setEmailError(error.message)
          } else if (error.path[0] === 'password') {
            setPasswordError(error.message)
          }
        })
      }
      return
    }

    setLoading(true)

    try {
      await signup(email, password)
      // Redirect to dashboard on success
      navigate('/dashboard')
    } catch (err: unknown) {
      // Use typed error handling
      setGeneralError(getErrorMessage(err, t('auth.signup.errorMessage')))
    } finally {
      setLoading(false)
    }
  }

  const handleEmailChange = (e: ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value)
    setEmailError('') // Clear error on change
  }

  const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value)
    setPasswordError('') // Clear error on change
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-app-primary dark:bg-dark-app-primary transition-colors duration-300 relative">
      {/* Language Toggle - Top Right */}
      <div className="absolute top-4 right-4 z-20">
        <LanguageToggle />
      </div>

      {/* Hero Section - Left Side */}
      <div className="relative w-full lg:w-1/2 min-h-[40vh] lg:min-h-screen flex items-center justify-center bg-app-secondary dark:bg-dark-app-secondary overflow-hidden">
        {/* Animated Background - covers entire left side */}
        <AnimatedBackground />

        <HeroSection
          title={t('auth.hero.title')}
          subtitle={t('auth.hero.subtitle')}
          showAnimation={false}
        />
      </div>

      {/* Form Section - Right Side */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8">
          <div>
            <h2 className="text-3xl font-extrabold text-app-primary dark:text-dark-app-primary">
              {t('auth.signup.title')}
            </h2>
            <p className="mt-2 text-sm text-app-secondary dark:text-dark-app-secondary">
              {t('auth.signup.subtitle')}{' '}
              <Link to="/login" className="font-medium text-primary hover:text-primary-dark transition-colors">
                {t('auth.signup.loginLink')}
              </Link>
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-app-primary dark:text-dark-app-primary mb-1">
                  {t('auth.signup.email')}
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  className={`appearance-none relative block w-full px-3 py-2 border ${
                    emailError ? 'border-red-500' : 'border-app-primary dark:border-dark-app-primary'
                  } bg-app-secondary dark:bg-dark-app-secondary placeholder-app-secondary dark:placeholder-dark-app-secondary text-app-primary dark:text-dark-app-primary rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors sm:text-sm`}
                  placeholder={t('auth.signup.emailPlaceholder')}
                  value={email}
                  onChange={handleEmailChange}
                  disabled={loading}
                />
                {emailError && (
                  <p className="mt-1 text-sm text-red-600">{emailError}</p>
                )}
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-app-primary dark:text-dark-app-primary mb-1">
                  {t('auth.signup.password')}
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  className={`appearance-none relative block w-full px-3 py-2 border ${
                    passwordError ? 'border-red-500' : 'border-app-primary dark:border-dark-app-primary'
                  } bg-app-secondary dark:bg-dark-app-secondary placeholder-app-secondary dark:placeholder-dark-app-secondary text-app-primary dark:text-dark-app-primary rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors sm:text-sm`}
                  placeholder={t('auth.signup.passwordPlaceholder')}
                  value={password}
                  onChange={handlePasswordChange}
                  disabled={loading}
                />
                {passwordError && (
                  <p className="mt-1 text-sm text-red-600">{passwordError}</p>
                )}
              </div>
            </div>

            {generalError && <ErrorMessage message={generalError} />}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? t('auth.signup.submittingButton') : t('auth.signup.submitButton')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Signup
