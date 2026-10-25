/**
 * Semantic design tokens for the mobile app.
 *
 * These tokens mirror the naming conventions used in web artifacts (index.css)
 * so that multi-artifact projects share a cohesive visual identity.
 *
 * Replace the placeholder values below with values that match the project's
 * brand. If a sibling web artifact exists, read its index.css and convert the
 * HSL values to hex so both artifacts use the same palette.
 *
 * To add dark mode, add a `dark` key with the same token names.
 * The useColors() hook will automatically pick it up.
 */

const colors = {
  light: {
    text: '#24382f',
    tint: '#325d4a',
    background: '#f6f7f2',
    foreground: '#24382f',
    card: '#fffefa',
    cardForeground: '#24382f',
    primary: '#325d4a',
    primaryForeground: '#fffffa',
    secondary: '#edf1ea',
    secondaryForeground: '#2c4e3f',
    muted: '#edf1ea',
    mutedForeground: '#7c9284',
    accent: '#ddeac3',
    accentForeground: '#2c4e3f',
    destructive: '#b65e51',
    destructiveForeground: '#fffefa',
    border: '#e0e5dc',
    input: '#e0e5dc',
    forest: '#244a3c',
    forestSoft: '#315f4f',
    lime: '#c7e36c',
    terracotta: '#d49a79',
    lavender: '#c3a8c4',
    blueGrey: '#7295a4',
    sand: '#d9d5c8',
    success: '#5f8c61',
    incomeBg: '#eaf1e4',
    expenseBg: '#f7eee7',
    warningBg: '#fbf1e1',
    subtle: '#f9faf6',
  },
  radius: 13,
};

export default colors;
