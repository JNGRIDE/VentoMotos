
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
      <Button variant="ghost" size="icon" className="rounded-2xl h-12 w-12 opacity-0">
        <Sun className="h-5 w-5" />
      </Button>
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
      className="rounded-2xl h-12 w-12 transition-all hover:bg-secondary/80 active:scale-90 group"
      aria-label="Cambiar tema"
    >
      {theme === "dark" ? (
        <Sun className="h-5 w-5 text-primary transition-all animate-in zoom-in spin-in-90 duration-500 group-hover:rotate-45" />
      ) : (
        <Moon className="h-5 w-5 text-slate-700 transition-all animate-in zoom-in duration-500 group-hover:-rotate-12" />
      )}
    </Button>
  )
}
