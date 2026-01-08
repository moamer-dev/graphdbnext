import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle2, XCircle } from 'lucide-react'
import { Message } from '../app/dashboard/hooks/useMessage'

interface MessageAlertProps {
  message: Message | null
}

export function MessageAlert ({ message }: MessageAlertProps) {
  if (!message) return null

  return (
    <Alert
      variant={message.type === 'error' ? 'destructive' : 'default'}
      className={message.type === 'success' ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800' : ''}
    >
      {message.type === 'success' ? (
        <CheckCircle2 className="h-4 w-4 text-green-600" />
      ) : (
        <XCircle className="h-4 w-4" />
      )}
      <AlertDescription className={message.type === 'success' ? 'text-green-800 dark:text-green-200' : ''}>
        {message.text}
      </AlertDescription>
    </Alert>
  )
}

