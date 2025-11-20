import { useState, FormEvent, ChangeEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { login } from '../services/api'
import { createLoginSchema } from '../schemas/auth'
import { ZodError } from 'zod'
import { isApiError, getErrorMessage } from '../types'
import ErrorMessage from '../components/ErrorMessage'
import { HeroSection } from '../components/HeroSection'
import { LanguageToggle } from '../components/LanguageToggle'
import { GoogleSignInButton } from '../components/GoogleSignInButton'

function Login() {
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
      createLoginSchema(t).parse({ email, password })
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
      await login(email, password)
      // Redirect to dashboard on success
      navigate('/dashboard')
    } catch (err: unknown) {
      // Use typed error handling
      if (isApiError(err) && err.response.status === 401) {
        setGeneralError(t('auth.login.invalidCredentials'))
      } else {
        setGeneralError(getErrorMessage(err, t('auth.login.errorMessage')))
      }
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
        {/* Static gradient overlay */}
        <div className="absolute inset-0 pointer-events-none"
             style={{
               background: 'radial-gradient(ellipse 800px 600px at bottom right, rgba(0, 255, 136, 0.2) 0%, rgba(0, 255, 136, 0.1) 40%, transparent 70%)'
             }}>
        </div>

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
              {t('auth.login.title')}
            </h2>
            <p className="mt-2 text-sm text-app-secondary dark:text-dark-app-secondary">
              {t('auth.login.subtitle')}{' '}
              <Link to="/signup" className="font-medium text-primary hover:text-primary-dark transition-colors">
                {t('auth.login.createAccount')}
              </Link>
            </p>
          </div>

          {/* Google Sign-In Button */}
          <div className="mt-6">
            <GoogleSignInButton />
          </div>

          {/* Separator */}
          <div className="relative mt-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-app-primary dark:border-dark-app-primary opacity-30"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-app-primary dark:bg-dark-app-primary text-app-secondary dark:text-dark-app-secondary">
                {t('auth.google.separator')}
              </span>
            </div>
          </div>

          <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-app-primary dark:text-dark-app-primary mb-1">
                  {t('auth.login.email')}
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  className={`appearance-none relative block w-full px-3 py-2 border ${
                    emailError ? 'border-red-500' : 'border-app-primary dark:border-dark-app-primary'
                  } bg-app-secondary dark:bg-dark-app-secondary placeholder-app-secondary dark:placeholder-dark-app-secondary text-app-primary dark:text-dark-app-primary rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors sm:text-sm`}
                  placeholder={t('auth.login.emailPlaceholder')}
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
                  {t('auth.login.password')}
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  className={`appearance-none relative block w-full px-3 py-2 border ${
                    passwordError ? 'border-red-500' : 'border-app-primary dark:border-dark-app-primary'
                  } bg-app-secondary dark:bg-dark-app-secondary placeholder-app-secondary dark:placeholder-dark-app-secondary text-app-primary dark:text-dark-app-primary rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors sm:text-sm`}
                  placeholder={t('auth.login.passwordPlaceholder')}
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
                {loading ? t('auth.login.submittingButton') : t('auth.login.submitButton')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Login
