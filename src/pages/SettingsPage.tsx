import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { Eye, EyeOff, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/use-toast'
import { getSettings, saveSettings, clearSettings } from '@/lib/settings'

const schema = z.object({
  baseUrl: z
    .string()
    .refine((v) => v === '' || /^https?:\/\/.+/.test(v), {
      message: 'Must be a valid URL starting with http:// or https://',
    }),
  apiKey: z.string(),
  apiSecret: z.string(),
})

type FormValues = z.infer<typeof schema>

export function SettingsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showSecret, setShowSecret] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: getSettings(),
  })

  function onSave(values: FormValues) {
    saveSettings(values)
    queryClient.clear()
    toast({ title: 'Settings saved', description: 'API credentials updated.' })
    navigate('/')
  }

  function onClear() {
    clearSettings()
    reset({ baseUrl: '', apiKey: '', apiSecret: '' })
    queryClient.clear()
    toast({ title: 'Settings cleared', description: 'Reverted to default session auth.' })
  }

  return (
    <div className="max-w-lg mx-auto space-y-8">
      <div className="flex items-center gap-3">
        <Settings className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-xl font-semibold">Connection Settings</h1>
          <p className="text-sm text-muted-foreground">
            Configure the ERPNext instance and API credentials.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSave)} className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="baseUrl">ERPNext URL</Label>
          <Input
            id="baseUrl"
            placeholder="https://erp.example.com"
            {...register('baseUrl')}
          />
          {errors.baseUrl && (
            <p className="text-sm text-destructive">{errors.baseUrl.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="apiKey">API Key</Label>
          <Input
            id="apiKey"
            placeholder="your_api_key"
            autoComplete="username"
            {...register('apiKey')}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="apiSecret">API Secret</Label>
          <div className="relative">
            <Input
              id="apiSecret"
              type={showSecret ? 'text' : 'password'}
              placeholder="your_api_secret"
              autoComplete="current-password"
              className="pr-10"
              {...register('apiSecret')}
            />
            <button
              type="button"
              onClick={() => setShowSecret((v) => !v)}
              className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground"
              aria-label={showSecret ? 'Hide secret' : 'Show secret'}
            >
              {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="submit">Save</Button>
          <Button type="button" variant="outline" onClick={onClear}>
            Clear credentials
          </Button>
        </div>
      </form>
    </div>
  )
}
