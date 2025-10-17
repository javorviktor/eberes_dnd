# Public Assets

This folder contains static assets that can be accessed directly in your Next.js application.

## Usage

Files in this folder can be referenced directly from your components using the root path `/`:

```jsx
// Example: If you have an image at public/logo.png
<img src="/logo.png" alt="Logo" />

// Example: If you have an image at public/images/character.png
<img src="/images/character.png" alt="Character" />
```

## Recommended Structure

```
public/
├── images/
│   ├── characters/
│   ├── races/
│   ├── classes/
│   ├── conditions/
│   ├── ui/
│   └── icons/
├── icons/
└── favicon.ico
```

## For D&D Character Builder

You can organize your images like:
- `/images/races/` - Race illustrations
- `/images/classes/` - Class icons
- `/images/characters/` - Character portraits
- `/images/conditions/` - D&D condition icons and status effects
- `/images/ui/` - UI elements, backgrounds, buttons, etc.
- `/icons/` - UI icons and symbols
