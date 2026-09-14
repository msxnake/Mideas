module.exports = {
      content: ['./index.html', './*.{ts,tsx}', './components/**/*.{ts,tsx}', './contexts/**/*.{ts,tsx}', './hooks/**/*.{ts,tsx}', './handlers/**/*.{ts,tsx}', './utils/**/*.{ts,tsx}'],
      darkMode: 'class', // Ensure dark mode is enabled
      theme: {
        extend: {
          colors: {
            msx: {
              // Original MSX Palette for content - REMAINS UNCHANGED
              transparent: 'transparent',
              black: '#000000',
              mediumgreen: '#3EB847',
              lightgreen: '#74D07D',
              darkblue: '#2F2FC1',
              lightblue: '#5858FC',
              darkred: '#B63125',
              cyan: '#68D2DA',
              mediumred: '#FC584A',
              lightred: '#FF8E81',
              darkyellow: '#C0BF3B',
              lightyellow: '#E7E474',
              darkgreen: '#309337',
              magenta: '#B640C8',
              gray: '#999999', // This is an MSX palette color, not a UI theme color.
              white: '#FFFFFF',

              // UI specific colors - Now using CSS Variables for dynamic theming
              bgcolor: 'var(--msx-bgcolor)',
              'bgcolor-dark': 'color-mix(in srgb, var(--msx-bgcolor) 82%, #000000)',
              'bgcolor-darker': 'color-mix(in srgb, var(--msx-bgcolor) 70%, #000000)',
              panelbg: 'var(--msx-panelbg)',
              'panelbg-dark': 'color-mix(in srgb, var(--msx-panelbg) 82%, #000000)',
              accent: 'var(--msx-accent)',
              highlight: 'var(--msx-highlight)',
              primary: 'var(--msx-textprimary)',
              textprimary: 'var(--msx-textprimary)',
              textsecondary: 'var(--msx-textsecondary)',
              border: 'var(--msx-border)',
              danger: 'var(--msx-danger)',
              warning: 'var(--msx-warning)',
            }
          },
          fontFamily: {
            'pixel': ['"Press Start 2P"', 'monospace'], 
            'sans': ['Inter', 'sans-serif'], 
          },
          keyframes: {
            fadeIn: {
              '0%': { opacity: '0' },
              '100%': { opacity: '1' },
            },
            slideIn: {
              '0%': { transform: 'translateY(20px)', opacity: '0'},
              '100%': { transform: 'translateY(0px)', opacity: '1'},
            }
          },
          animation: {
            fadeIn: 'fadeIn 0.5s ease-out',
            slideIn: 'slideIn 0.5s ease-out forwards',
          }
        }
      }
    };
