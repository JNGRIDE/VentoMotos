
"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"

export function ModeToggle() {
  const { setTheme, theme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  // Prevenir errores de hidratación asegurando que el componente solo se renderice en el cliente
  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="h-12 w-12 flex items-center justify-center">
        <div className="h-5 w-5 rounded-full bg-muted animate-pulse" />
      </div>
    )
  }

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={toggleTheme}
      className="rounded-2xl h-12 w-12 transition-all duration-500 hover:bg-primary/10 active:scale-90 group relative overflow-hidden"
      aria-label="Cambiar tema"
    >
      <Sun className="h-5 w-5 text-primary rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 duration-500" />
      <Moon className="absolute h-5 w-5 text-primary rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 duration-500" />
      
      {/* Indicador de estado sutil */}
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
