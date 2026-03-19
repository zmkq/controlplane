'use server'

import { signIn } from '@/auth'
import { AuthError } from 'next-auth'

export async function authenticate(username: string, password: string) {
  try {
    await signIn('credentials', {
      username,
      password,
      redirect: false,
    })
    
    return { success: true }
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return { error: 'Invalid username or password' }
        default:
          return { error: 'Something went wrong' }
      }
    }
    throw error
  }
}
