import { useContext } from 'react'
import { ThemeContext } from '@/shared/utils/ThemeProvider'

export function useTheme() {
  return useContext(ThemeContext)
}
