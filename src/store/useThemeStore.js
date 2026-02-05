import { create } from 'zustand'
import { themeData } from '../utils/changeTheme'

export const useThemeStore = create((set) => ({
    // Default to purple theme
    currentTheme: themeData.purple,
    currentThemeName: 'purple',

    // Action to change theme
    setTheme: (themeName) => {
        const theme = themeData[themeName]
        if (theme) {
            set({ currentTheme: theme, currentThemeName: themeName })
        } else {
            console.warn(`Theme '${themeName}' not found in themeData`)
        }
    }
}))
