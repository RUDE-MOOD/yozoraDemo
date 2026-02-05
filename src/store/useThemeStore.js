import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { themeData } from '../utils/changeTheme'

export const useThemeStore = create(
    persist(
        (set) => ({
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
        }),
        {
            name: 'yozora-theme-storage', // unique name
            storage: createJSONStorage(() => localStorage),
        }
    )
)
