import { signal, computed } from '@angular/core';
import { ThemeService, type Theme } from '../services/theme.service';

export function createThemeClasses(themeService: ThemeService) {
  return {
    // Background colors
    bgPrimary: computed(() =>
      themeService.theme() === 'dark' ? 'bg-[#0E0E10]' : 'bg-white'
    ),
    bgSecondary: computed(() =>
      themeService.theme() === 'dark' ? 'bg-[#18181B]' : 'bg-slate-50'
    ),
    bgTertiary: computed(() =>
      themeService.theme() === 'dark' ? 'bg-[#0A0A0A]' : 'bg-slate-100'
    ),

    // Text colors
    textPrimary: computed(() =>
      themeService.theme() === 'dark' ? 'text-white' : 'text-slate-900'
    ),
    textSecondary: computed(() =>
      themeService.theme() === 'dark' ? 'text-[#B8B8B8]' : 'text-slate-600'
    ),
    textMuted: computed(() =>
      themeService.theme() === 'dark' ? 'text-[#A9A9A9]' : 'text-slate-500'
    ),

    // Border colors
    borderPrimary: computed(() =>
      themeService.theme() === 'dark' ? 'border-[#2B2B31]' : 'border-slate-200'
    ),

    // Card styling
    card: computed(() =>
      themeService.theme() === 'dark'
        ? 'bg-[#18181B] border border-[#2B2B31]'
        : 'bg-white border border-slate-200'
    ),

    // Hover states
    hoverBorder: computed(() =>
      themeService.theme() === 'dark'
        ? 'hover:border-[#D4AF37]/50'
        : 'hover:border-slate-300'
    ),
  };
}
