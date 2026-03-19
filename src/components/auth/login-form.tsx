'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { authenticate } from '@/app/login/actions'
import { motion } from 'framer-motion'
import { Loader2, ArrowRight, Eye, EyeOff, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTranslations } from '@/lib/i18n'

export function LoginForm() {
  const router = useRouter()
  const { t } = useTranslations()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const result = await authenticate(username, password)

      if (result?.error) {
        setError(result.error)
        setIsLoading(false)
        return
      }

      router.push('/')
      router.refresh()
    } catch {
      setError(t('auth.errors.connection', 'Connection failed'))
      setIsLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <div className="mb-8 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', duration: 0.5 }}
          className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#dbec0a]/20 bg-[#dbec0a]/10 px-4 py-2"
        >
          <Sparkles className="h-4 w-4 text-[#dbec0a]" />
          <span className="text-xs font-medium text-[#dbec0a]">
            {t('auth.badge', 'Secure Access')}
          </span>
        </motion.div>
        <h1 className="mb-2 text-3xl font-bold text-white">
          {t('auth.title', 'Welcome back')}
        </h1>
        <p className="text-white/40">
          {t(
            'auth.subtitle',
            'Sign in to continue to your supplement operations dashboard',
          )}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-white/50">
            {t('auth.usernameLabel', 'Username')}
          </label>
          <div className="group relative">
            <div
              className={cn(
                'absolute -inset-0.5 rounded-xl bg-gradient-to-r from-[#dbec0a] to-[#00d4ff] opacity-0 blur transition-opacity duration-300',
                focusedField === 'username' && 'opacity-30',
              )}
            />
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onFocus={() => setFocusedField('username')}
              onBlur={() => setFocusedField(null)}
              disabled={isLoading}
              autoComplete="username"
              autoFocus
              required
              placeholder={t('auth.usernamePlaceholder', 'Enter username')}
              className={cn(
                'relative h-13 w-full rounded-xl px-4',
                'border border-white/10 bg-white/5 text-base text-white',
                'placeholder:text-white/20',
                'outline-none transition-all duration-300',
                'hover:border-white/20 hover:bg-white/[0.07]',
                'focus:border-[#dbec0a]/50 focus:bg-white/[0.08]',
              )}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-white/50">
            {t('auth.passwordLabel', 'Password')}
          </label>
          <div className="group relative">
            <div
              className={cn(
                'absolute -inset-0.5 rounded-xl bg-gradient-to-r from-[#00d4ff] to-[#a855f7] opacity-0 blur transition-opacity duration-300',
                focusedField === 'password' && 'opacity-30',
              )}
            />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setFocusedField('password')}
              onBlur={() => setFocusedField(null)}
              disabled={isLoading}
              autoComplete="current-password"
              required
              placeholder={t('auth.passwordPlaceholder', 'Enter your password')}
              className={cn(
                'relative h-13 w-full rounded-xl px-4 pe-12',
                'border border-white/10 bg-white/5 text-base text-white',
                'placeholder:text-white/20',
                'outline-none transition-all duration-300',
                'hover:border-white/20 hover:bg-white/[0.07]',
                'focus:border-[#a855f7]/50 focus:bg-white/[0.08]',
              )}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute end-4 top-1/2 -translate-y-1/2 text-white/30 transition-colors hover:text-white/60"
              aria-label={t('auth.togglePassword', 'Toggle password visibility')}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3"
          >
            <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-sm text-red-400">{error}</span>
          </motion.div>
        )}

        <motion.button
          type="submit"
          disabled={isLoading || !username || !password}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={cn(
            'relative h-13 w-full overflow-hidden rounded-xl text-base font-bold text-black',
            'bg-gradient-to-r from-[#dbec0a] to-[#a3e635]',
            'shadow-[0_0_20px_rgba(219,236,10,0.3)] transition-shadow duration-300',
            'hover:shadow-[0_0_40px_rgba(219,236,10,0.5)]',
            'disabled:cursor-not-allowed disabled:opacity-50',
          )}
        >
          <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent hover:animate-[shimmer_1.5s_infinite]" />
          <span className="relative flex items-center justify-center gap-2">
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                {t('auth.signingIn', 'Signing in...')}
              </>
            ) : (
              <>
                {t('auth.submit', 'Sign In')}
                <ArrowRight className="h-5 w-5" />
              </>
            )}
          </span>
        </motion.button>
      </form>

      <p className="mt-6 text-center text-xs text-white/20">
        {t('auth.footer', 'Encrypted connection')}
      </p>
    </motion.div>
  )
}
