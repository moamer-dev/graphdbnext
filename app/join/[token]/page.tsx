'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Loader2, UserPlus, Shield, CheckCircle2, ChevronRight, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { signIn } from 'next-auth/react'

export default function JoinTeamPage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string

  const [loading, setLoading] = useState(true)
  const [invitation, setInvitation] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  
  const [form, setForm] = useState({
    name: '',
    password: '',
    confirmPassword: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [declining, setDeclining] = useState(false)
  const [status, setStatus] = useState<'IDLE' | 'JOINED' | 'DECLINED'>('IDLE')

  useEffect(() => {
    fetchInvitation()
  }, [token])

  const fetchInvitation = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/invitations/public/${token}`)
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Invitation invalid or expired')
      }
      const data = await res.json()
      setInvitation(data.data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch(`/api/invitations/public/${token}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: form.name,
          password: form.password
        })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to join team')
      }

      toast.success('Welcome! You have successfully joined the team.')
      
      // Automatically sign in the user
      await signIn('credentials', {
        email: invitation.email,
        password: form.password,
        redirect: false
      })

      setStatus('JOINED')
      setTimeout(() => router.push('/dashboard'), 2000)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDecline = async () => {
    if (!confirm('Are you sure you want to decline this invitation?')) return

    setDeclining(true)
    try {
      const res = await fetch(`/api/invitations/public/${token}/decline`, {
        method: 'POST'
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to decline invitation')
      }

      toast.success('Invitation declined')
      setStatus('DECLINED')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setDeclining(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  if (error || status === 'DECLINED' || status === 'JOINED') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-md border-border/50 shadow-md bg-background/80 backdrop-blur-xl animate-in fade-in zoom-in duration-300">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              {status === 'JOINED' ? <CheckCircle2 className="h-6 w-6 text-green-600" /> : <Mail className="h-6 w-6 text-primary" />}
            </div>
            <CardTitle className={error ? 'text-destructive' : 'text-foreground'}>
              {error ? 'Invalid Invitation' : status === 'JOINED' ? 'Successfully Joined!' : 'Invitation Declined'}
            </CardTitle>
            <CardDescription className="mt-2">
              {error || (status === 'JOINED' ? 'Redirecting you to your dashboard...' : 'You have declined the invitation to join the team. Thank you for letting us know.')}
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button className="w-full font-bold" onClick={() => router.push('/')}>
              Go to Homepage
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4 py-12">
      <div className="w-full max-w-md space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-primary/10 mb-4 ring-8 ring-primary/5">
            <UserPlus className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Welcome Aboard!</h1>
          <p className="text-muted-foreground">
            You've been invited by <span className="font-semibold text-foreground">{invitation.invitedBy}</span> to join
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 border border-primary/10 mt-2">
            <Shield className="h-4 w-4 text-primary" />
            <span className="text-sm font-bold tracking-tight uppercase">{invitation.teamName}</span>
          </div>
        </div>

        <Card className="border-border/50 bg-background/80 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-xl">Create Your Account</CardTitle>
            <CardDescription className="text-xs">
              Fill in your details to accept the invitation and start collaborating.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleJoin}>
            <CardContent className="space-y-4 pt-0">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider ml-1">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="email" 
                    value={invitation.email} 
                    disabled 
                    className="pl-10 h-10 bg-muted/30 border-border/40 font-medium" 
                  />
                </div>
              </div>
              
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider ml-1">Full Name</Label>
                <Input 
                  id="name" 
                  placeholder="Enter your name" 
                  required 
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="h-10 shadow-none focus-visible:ring-primary/20"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider ml-1">Password</Label>
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="Minimum 6 characters" 
                  required 
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="h-10 shadow-none focus-visible:ring-primary/20"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirm" className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider ml-1">Confirm Password</Label>
                <Input 
                  id="confirm" 
                  type="password" 
                  placeholder="Repeat your password" 
                  required 
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  className="h-10 shadow-none focus-visible:ring-primary/20"
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3 mt-2">
              <Button type="submit" className="w-full h-10 text-sm font-bold" disabled={submitting || declining}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Joining...
                  </>
                ) : (
                  <>
                    Accept Invitation & Join
                    <ChevronRight className="ml-1.5 h-4 w-4" />
                  </>
                )}
              </Button>
              <Button 
                type="button" 
                variant="ghost" 
                className="w-full h-9 text-xs font-semibold text-muted-foreground hover:text-destructive hover:bg-destructive/5"
                onClick={handleDecline}
                disabled={submitting || declining}
              >
                {declining ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" /> : null}
                Decline Invitation
              </Button>
              <p className="text-center text-[10px] text-muted-foreground/60 px-6 mt-1">
                By clicking "Join", you agree to our terms of service and privacy policy.
              </p>
            </CardFooter>
            </form>
        </Card>

        <div className="text-center">
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <CheckCircle2 className="h-3 w-3 text-green-500" />
            Secure invitation link valid for 7 days
          </div>
        </div>
      </div>
    </div>
  )
}
