'use client'

import * as React from "react"
import { Languages } from "lucide-react"
import { useLocale } from "next-intl"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useRouter, usePathname } from "next/navigation"

export function LanguageToggle() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()

  const handleLanguageChange = (newLocale: string) => {
    // Set cookie and refresh
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax`
    router.refresh()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-md border-none shadow-none">
          <Languages className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">Toggle language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="rounded-xl border-border shadow-none">
        <DropdownMenuItem 
          onClick={() => handleLanguageChange("en")}
          className={locale === 'en' ? 'bg-primary/10 text-primary font-bold' : ''}
        >
          English
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleLanguageChange("de")}
          className={locale === 'de' ? 'bg-primary/10 text-primary font-bold' : ''}
        >
          Deutsch (German)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
