import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { themeData } from '../utils/changeTheme'

export const useThemeStore = create(
    persist(
        (set) => ({
            // Default to blue theme + mixed skybox
            currentTheme: themeData.blue,
            currentThemeName: 'blue',

            // Skybox type: 'classic' (layered) or 'upgrade' (shader)
            skyboxType: 'mixed',

            // Action to change theme
            setTheme: (themeName) => {
                const theme = themeData[themeName]
                if (theme) {
                    set({ currentTheme: theme, currentThemeName: themeName })
                } else {
                    console.warn(`Theme '${themeName}' not found in themeData`)
                }
            },

            // Action to change skybox
            setSkyboxType: (type) => set({ skyboxType: type }),
        }),
        {
            name: 'yozora-theme-storage', // unique name
            storage: createJSONStorage(() => localStorage),
        }
    )
)
