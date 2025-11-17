import { useState, FormEvent, ChangeEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { signup } from '../services/api'
import { signupSchema } from '../schemas/auth'
import { ZodError } from 'zod'
import { getErrorMessage } from '../types'
import ErrorMessage from '../components/ErrorMessage'

function Signup() {
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
      signupSchema.parse({ email, password })
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
      setGeneralError(getErrorMessage(err, 'Erro ao criar conta. Tente novamente.'))
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
    <div className="min-h-screen flex items-center justify-center bg-app-primary dark:bg-dark-app-primary py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="max-w-md w-full space-y-8 bg-app-secondary dark:bg-dark-app-secondary p-8 rounded-lg shadow-lg border border-app-primary dark:border-dark-app-primary">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-app-primary dark:text-dark-app-primary">
            Criar nova conta
          </h2>
          <p className="mt-2 text-center text-sm text-app-secondary dark:text-dark-app-secondary">
            Ou{' '}
            <Link to="/login" className="font-medium text-primary hover:text-primary-dark transition-colors">
              faca login se ja tem uma conta
            </Link>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-app-primary dark:text-dark-app-primary mb-1">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                className={`appearance-none relative block w-full px-3 py-2 border ${
                  emailError ? 'border-red-500' : 'border-app-primary dark:border-dark-app-primary'
                } bg-app-primary dark:bg-dark-app-primary placeholder-app-secondary dark:placeholder-dark-app-secondary text-app-primary dark:text-dark-app-primary rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors sm:text-sm`}
                placeholder="seu@email.com"
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
                Senha
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                className={`appearance-none relative block w-full px-3 py-2 border ${
                  passwordError ? 'border-red-500' : 'border-app-primary dark:border-dark-app-primary'
                } bg-app-primary dark:bg-dark-app-primary placeholder-app-secondary dark:placeholder-dark-app-secondary text-app-primary dark:text-dark-app-primary rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors sm:text-sm`}
                placeholder="Minimo 6 caracteres"
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
              className="btn-primary group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Criando conta...' : 'Criar conta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Signup
