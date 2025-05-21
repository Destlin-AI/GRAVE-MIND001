"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider, type ThemeProviderProps } from "next-themes"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  const [mounted, setMounted] = React.useState(false)

  // Only render theme provider after first client-side render
  React.useEffect(() => {
    setMounted(true)
  }, [])

  // During server rendering and first client render, render a placeholder
  if (!mounted) {
    return <>{children}</>
  }

  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
export default function DragAndDropUploader() {
  // Component code here...

  return <div>{/* Component JSX */}</div>
} // Only one closing brace needed here
