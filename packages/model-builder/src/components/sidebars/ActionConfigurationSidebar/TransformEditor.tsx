'use client'

import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../../ui/select'
import { X } from 'lucide-react'
import type { TextTransform } from '../../../stores/actionConfigurationStore'

interface TransformEditorProps {
  transforms: TextTransform[]
  onTransformsChange: (transforms: TextTransform[]) => void
}

export function TransformEditor({ transforms, onTransformsChange }: TransformEditorProps) {
  return (
    <div className="space-y-2">
      {transforms.map((transform, index) => (
        <div key={index} className="p-2 border rounded space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium">Transform {index + 1}</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                onTransformsChange(transforms.filter((_, i) => i !== index))
              }}
              className="h-6 w-6 p-0 text-destructive"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
          <Select
            value={transform.type}
            onValueChange={(value) => {
              const updated = [...transforms]
              updated[index] = { ...updated[index], type: value as 'lowercase' | 'uppercase' | 'trim' | 'replace' | 'regex' } as TextTransform
              onTransformsChange(updated)
            }}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="lowercase">Lowercase</SelectItem>
              <SelectItem value="uppercase">Uppercase</SelectItem>
              <SelectItem value="trim">Trim Whitespace</SelectItem>
              <SelectItem value="replace">Replace Text</SelectItem>
              <SelectItem value="regex">Regex Replace</SelectItem>
            </SelectContent>
          </Select>
          {transform.type === 'replace' && (
            <>
              <Input
                placeholder="Replace from"
                className="h-7 text-xs"
                value={transform.replaceFrom || ''}
                onChange={(e) => {
                  const updated = [...transforms]
                  updated[index] = { ...updated[index], replaceFrom: e.target.value } as TextTransform
                  onTransformsChange(updated)
                }}
              />
              <Input
                placeholder="Replace to"
                className="h-7 text-xs"
                value={transform.replaceTo || ''}
                onChange={(e) => {
                  const updated = [...transforms]
                  updated[index] = { ...updated[index], replaceTo: e.target.value } as TextTransform
                  onTransformsChange(updated)
                }}
              />
            </>
          )}
          {transform.type === 'regex' && (
            <>
              <Input
                placeholder="Regex pattern"
                className="h-7 text-xs"
                value={transform.regexPattern || ''}
                onChange={(e) => {
                  const updated = [...transforms]
                  updated[index] = { ...updated[index], regexPattern: e.target.value } as TextTransform
                  onTransformsChange(updated)
                }}
              />
              <Input
                placeholder="Replacement"
                className="h-7 text-xs"
                value={transform.regexReplacement || ''}
                onChange={(e) => {
                  const updated = [...transforms]
                  updated[index] = { ...updated[index], regexReplacement: e.target.value } as TextTransform
                  onTransformsChange(updated)
                }}
              />
            </>
          )}
        </div>
      ))}
      {transforms.length === 0 && (
        <p className="text-[10px] text-muted-foreground">No transforms defined.</p>
      )}
    </div>
  )
}

