import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { UserPlus, Loader2, ArrowRight, ArrowLeft, Briefcase, Layers, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

interface RegisterFormProps {
  onSwitchToSignIn?: () => void
}

export function RegisterForm ({ onSwitchToSignIn }: RegisterFormProps) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  
  // Account Info
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  
  // Onboarding Info
  const [workspaceName, setWorkspaceName] = useState('')
  const [projectName, setProjectName] = useState('')
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Auto-fill workspace name if name is provided
  useEffect(() => {
    if (name && !workspaceName) {
      setWorkspaceName(`Main Workspace`)
    }
    if (name && !projectName) {
        setProjectName('Main Project')
    }
  }, [name, workspaceName, projectName])

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    if (!email || !password) {
        setError('Email and password are required')
        return
    }

    setStep(2)
  }

  const handleSubmit = async (e: React.FormEvent, skipOnboarding = false) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          password,
          name: name || null,
          workspaceName: skipOnboarding ? null : workspaceName,
          projectName: skipOnboarding ? null : projectName
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to create account')
        toast.error(data.error || 'Failed to create account')
        return
      }

      toast.success(
        skipOnboarding 
          ? 'Account created successfully!' 
          : 'Welcome! Account and initial resources created.'
      )
      
      // Auto-sign in after registration
      setLoading(true) // Keep loading state while signing in
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
        callbackUrl: '/dashboard'
      })

      if (result?.error) {
        toast.error('Account created, but automatic sign-in failed. Please sign in manually.')
        router.push('/auth/signin')
      } else {
        router.push('/dashboard')
        router.refresh()
      }
    } catch (error: any) {
      setError('An error occurred. Please try again.')
      toast.error('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md border-2 shadow-sm overflow-hidden">
      <div className="h-1.5 w-full bg-muted overflow-hidden">
         <div 
            className="h-full bg-primary transition-all duration-500 ease-in-out" 
            style={{ width: `${(step / 2) * 100}%` }}
         />
      </div>

      <CardHeader className="space-y-1 pt-8">
        <div className="flex justify-center mb-2">
            <div className="bg-primary/10 p-3 rounded-full">
                {step === 1 ? <UserPlus className="h-6 w-6 text-primary" /> : <Sparkles className="h-6 w-6 text-primary" />}
            </div>
        </div>
        <CardTitle className="text-2xl text-center">
            {step === 1 ? 'Create Account' : 'Quick Setup'}
        </CardTitle>
        <CardDescription className="text-center text-balance">
          {step === 1 
            ? 'Sign up to start managing your graph database schemas' 
            : 'Let\'s create your first workspace and project to get you started!'}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pb-8">
        {step === 1 ? (
          <form onSubmit={handleNext} className="space-y-4">
            {error && (
              <Alert variant="destructive" className="py-2">
                <AlertDescription className="text-xs">{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Name (Optional)</Label>
              <Input
                id="name"
                type="text"
                placeholder="Alex Johnson"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                className="h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="alex@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="h-10"
              />
            </div>
            <div className="grid grid-cols-2 gap-4 text-left">
                <div className="space-y-1.5">
                    <Label htmlFor="password" title="At least 6 characters" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Password</Label>
                    <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={loading}
                        minLength={6}
                        className="h-10"
                    />
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="confirmPassword" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Confirm</Label>
                    <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        disabled={loading}
                        minLength={6}
                        className="h-10"
                    />
                </div>
            </div>
            
            <Button
              type="submit"
              className="w-full h-11 text-base font-semibold group mt-2"
              disabled={loading}
            >
              Continue
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </form>
        ) : (
          <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
             {error && (
              <Alert variant="destructive" className="py-2">
                <AlertDescription className="text-xs">{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-1.5">
                <div className="flex items-center gap-2 mb-1">
                    <Briefcase className="h-3.5 w-3.5 text-primary" />
                    <Label htmlFor="workspaceName" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Workspace Name</Label>
                </div>
                <Input
                    id="workspaceName"
                    type="text"
                    placeholder="e.g., Development, Project X"
                    value={workspaceName}
                    onChange={(e) => setWorkspaceName(e.target.value)}
                    disabled={loading}
                    className="h-10"
                />
                <p className="text-[10px] text-muted-foreground">Workspaces help you group related projects and teams.</p>
            </div>

            <div className="space-y-1.5">
                <div className="flex items-center gap-2 mb-1">
                    <Layers className="h-3.5 w-3.5 text-primary" />
                    <Label htmlFor="projectName" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">First Project Name</Label>
                </div>
                <Input
                    id="projectName"
                    type="text"
                    placeholder="e.g., Graph Scraper, UI Redesign"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    disabled={loading}
                    className="h-10"
                />
            </div>

            <div className="flex flex-col gap-3 pt-2">
                <Button
                    type="submit"
                    className="w-full h-11 text-base font-semibold"
                    disabled={loading}
                >
                    {loading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Setting everything up...
                    </>
                    ) : (
                    <>
                        Complete Setup
                        <Sparkles className="ml-2 h-4 w-4" />
                    </>
                    )}
                </Button>
                
                <div className="flex items-center justify-between px-1">
                    <button 
                        type="button" 
                        onClick={() => setStep(1)}
                        className="text-xs text-muted-foreground hover:text-foreground flex items-center transition-colors px-2 py-1"
                        disabled={loading}
                    >
                        <ArrowLeft className="mr-1 h-3 w-3" />
                        Back
                    </button>

                    <button 
                        type="button" 
                        onClick={(e) => handleSubmit(e, true)}
                        className="text-xs text-primary font-medium hover:underline px-2 py-1"
                        disabled={loading}
                    >
                        Skip onboarding
                    </button>
                </div>
            </div>
          </form>
        )}

        {onSwitchToSignIn && step === 1 && (
          <div className="mt-8 text-center text-sm border-t pt-4">
            <button
              type="button"
              onClick={onSwitchToSignIn}
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              Already have an account? <span className="font-semibold text-primary">Sign in</span>
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

