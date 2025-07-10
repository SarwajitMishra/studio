
// src/lib/theme.ts

export type ColorTheme = {
  light: Record<string, string>;
  dark: Record<string, string>;
};

// HSL values as strings
export const COLOR_THEMES: Record<string, ColorTheme> = {
  default: { // Playful Sky Blue
    light: {
      'background-h': '200', 'background-s': '100%', 'background-l': '97%',
      'primary-h': '220', 'primary-s': '70%', 'primary-l': '75%',
      'accent-h': '40', 'accent-s': '100%', 'accent-l': '60%',
    },
    dark: {
      'background-h': '220', 'background-s': '25%', 'background-l': '15%',
      'primary-h': '220', 'primary-s': '60%', 'primary-l': '65%',
      'accent-h': '40', 'accent-s': '95%', 'accent-l': '55%',
    }
  },
  pink: { // Playful Pink Theme
    light: {
      'background-h': '340', 'background-s': '100%', 'background-l': '97%',
      'primary-h': '340', 'primary-s': '80%', 'primary-l': '70%',
      'accent-h': '320', 'accent-s': '90%', 'accent-l': '65%',
    },
    dark: {
      'background-h': '340', 'background-s': '20%', 'background-l': '15%',
      'primary-h': '340', 'primary-s': '70%', 'primary-l': '65%',
      'accent-h': '320', 'accent-s': '80%', 'accent-l': '60%',
    }
  },
  red: { // Sunset Theme
    light: {
      'background-h': '25', 'background-s': '50%', 'background-l': '95%',
      'primary-h': '0', 'primary-s': '72%', 'primary-l': '60%',
      'accent-h': '35', 'accent-s': '100%', 'accent-l': '60%',
    },
    dark: {
      'background-h': '15', 'background-s': '30%', 'background-l': '10%',
      'primary-h': '0', 'primary-s': '65%', 'primary-l': '55%',
      'accent-h': '35', 'accent-s': '90%', 'accent-l': '58%',
    }
  },
  green: { // Forest Theme
    light: {
      'background-h': '120', 'background-s': '20%', 'background-l': '94%',
      'primary-h': '145', 'primary-s': '63%', 'primary-l': '42%',
      'accent-h': '90', 'accent-s': '50%', 'accent-l': '60%',
    },
    dark: {
      'background-h': '130', 'background-s': '15%', 'background-l': '12%',
      'primary-h': '145', 'primary-s': '55%', 'primary-l': '40%',
      'accent-h': '90', 'accent-s': '45%', 'accent-l': '55%',
    }
  },
  blue: { // Oceanic Theme
    light: {
      'background-h': '210', 'background-s': '50%', 'background-l': '96%',
      'primary-h': '210', 'primary-s': '80%', 'primary-l': '60%',
      'accent-h': '180', 'accent-s': '70%', 'accent-l': '55%',
    },
    dark: {
      'background-h': '210', 'background-s': '30%', 'background-l': '10%',
      'primary-h': '210', 'primary-s': '70%', 'primary-l': '55%',
      'accent-h': '180', 'accent-s': '65%', 'accent-l': '50%',
    }
  },
  purple: { // Twilight Theme
    light: {
      'background-h': '260', 'background-s': '40%', 'background-l': '95%',
      'primary-h': '260', 'primary-s': '50%', 'primary-l': '65%',
      'accent-h': '300', 'accent-s': '80%', 'accent-l': '70%',
    },
    dark: {
      'background-h': '260', 'background-s': '20%', 'background-l': '12%',
      'primary-h': '260', 'primary-s': '45%', 'primary-l': '60%',
      'accent-h': '300', 'accent-s': '70%', 'accent-l': '65%',
    }
  },
};
