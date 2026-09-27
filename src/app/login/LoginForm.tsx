import { Suspense } from 'react'
import LoginForm from './LoginForm'

/**
 * useSearchParams() butuh Suspense boundary di build statis.
 */
export default function LoginPage() {
  return (
    <Suspense fallback={<div className="app-shell" />}>
      <LoginForm />
    </Suspense>
  )
}
