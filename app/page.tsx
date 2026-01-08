'use client'

import { useState, Suspense } from 'react'
import { Database } from 'lucide-react'
import { SignInForm } from '@/components/auth/SignInForm'
import { RegisterForm } from '@/components/auth/RegisterForm'

function AuthContent () {
  const [isSignIn, setIsSignIn] = useState(true)

  return (
    <>
      {isSignIn ? (
        <SignInForm onSwitchToRegister={() => setIsSignIn(false)} />
      ) : (
        <RegisterForm onSwitchToSignIn={() => setIsSignIn(true)} />
      )}
    </>
  )
}

export default function Home () {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-4">
        <div className="flex items-center justify-center mb-4">
          <Database className="h-12 w-12 text-primary" />
        </div>
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold">Graph Database Manager</h1>
          <p className="text-muted-foreground mt-2">
            Manage your Labeled Property Graph schemas
          </p>
        </div>
        <Suspense fallback={<div>Loading...</div>}>
          <AuthContent />
        </Suspense>
        <div className="text-center text-sm text-muted-foreground">
          <p>For research and development purposes</p>
        </div>
      </div>
    </div>
  )
}
