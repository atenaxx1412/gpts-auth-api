import { auth } from './firebase'
import { onAuthStateChanged, User } from 'firebase/auth'

export interface AuthState {
  user: User | null
  loading: boolean
}

export const getAuthState = (): Promise<User | null> => {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe()
      resolve(user)
    })
  })
}

export const requireAuth = async (): Promise<User> => {
  const user = await getAuthState()
  if (!user) {
    throw new Error('Authentication required')
  }
  return user
}