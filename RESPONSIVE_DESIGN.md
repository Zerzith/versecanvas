# Responsive Design Implementation for Versecanvas

## Breakpoints (Tailwind CSS)
- **sm**: 640px (Mobile landscape / Small tablets)
- **md**: 768px (Tablets)
- **lg**: 1024px (Small laptops)
- **xl**: 1280px (Desktops)
- **2xl**: 1536px (Large desktops)

## Common Responsive Patterns

```jsx
// Container
<div className="container mx-auto px-4 sm:px-6 lg:px-8">

// Grid
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">

// Flex responsive
<div className="flex flex-col md:flex-row gap-4">

// Hide/Show
<div className="hidden md:block"> // Desktop only
<div className="block md:hidden"> // Mobile only

// Text sizing
<h1 className="text-2xl sm:text-3xl lg:text-4xl">

// Spacing
<div className="p-4 md:p-6 lg:p-8">

// Button
<button className="w-full sm:w-auto px-4 py-2 sm:px-6 sm:py-3">
```
