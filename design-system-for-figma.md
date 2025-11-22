# FitTrack Design System for Figma

**Generated from React + Vite Frontend**
**Date: November 21, 2025**

---

## 📐 Design Tokens

### Colors (HSL Format)

```
Background Colors:
- background: hsl(0, 0%, 12%)          // Main dark background
- foreground: hsl(0, 0%, 94%)          // Text color
- card: hsl(0, 0%, 18%)                // Card backgrounds
- muted: hsl(0, 0%, 15%)               // Muted backgrounds

Primary Colors:
- primary: hsl(100, 50%, 24%)          // Sage green (main brand)
- primary-dark: hsl(100, 98%, 11%)     // Dark sage
- accent: hsl(118, 29%, 61%)           // Minted sage (highlights)

Interactive States:
- border: hsl(0, 0%, 25%)
- input: hsl(0, 0%, 18%)
- destructive: hsl(0, 84%, 60%)        // Error/delete red

Chart Colors:
- chart-primary: hsl(100, 50%, 24%)    // Sage
- chart-accent: hsl(118, 29%, 61%)     // Mint
- chart-gold: hsl(45, 90%, 65%)        // Gold/yellow
- #3B82F6 (Blue), #8B5CF6 (Purple), #10B981 (Green)
- #F59E0B (Orange), #EF4444 (Red), #EC4899 (Pink)
```

### Typography

```
Font Family: Inter, -apple-system, BlinkMacSystemFont, Segoe UI, system-ui, sans-serif
Font Smoothing: -webkit-font-smoothing: antialiased

Size Scale:
- xs: 0.75rem (12px)
- sm: 0.875rem (14px)
- base: 1rem (16px)
- lg: 1.125rem (18px)
- xl: 1.25rem (20px)
- 2xl: 1.5rem (24px)
- 3xl: 1.875rem (30px)
- 4xl: 2.25rem (36px)

Font Weights:
- regular: 400
- medium: 500
- semibold: 600
- bold: 700
```

### Spacing Scale (Tailwind)

```
0.5 = 2px   (0.125rem)
1   = 4px   (0.25rem)
2   = 8px   (0.5rem)
3   = 12px  (0.75rem)
4   = 16px  (1rem)
5   = 20px  (1.25rem)
6   = 24px  (1.5rem)
8   = 32px  (2rem)
10  = 40px  (2.5rem)
12  = 48px  (3rem)
```

### Border Radius

```
DEFAULT: 1rem (16px)
- sm: 0.875rem (14px)
- md: 0.875rem (14px)
- lg: 1rem (16px)
- xl: 1.25rem (20px)
- 2xl: 1.5rem (24px)
- full: 9999px (circular)
```

### Shadows

```
- shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05)
- shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)
- shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)
- shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)
- shadow-soft: 0 4px 20px hsl(0 0% 0% / 0.3)
- shadow-glow: 0 0 20px hsl(118 29% 61% / 0.4)  // Sage glow effect
```

### Breakpoints

```
sm: 640px   (Mobile landscape)
md: 768px   (Tablet)
lg: 1024px  (Desktop)
xl: 1280px  (Large desktop)
2xl: 1536px (Extra large)
```

---

## 🧩 Components Library

### 1. Button Component

**Variants:**

- **default**: Primary sage green, hover scale 95%, glow effect
- **destructive**: Red, for delete/danger actions
- **outline**: Border only, transparent background
- **secondary**: Muted gray
- **ghost**: No background, hover reveals muted
- **link**: Underline on hover

**Sizes:**

- **default**: h-10 (40px), px-4
- **sm**: h-9 (36px), px-3
- **lg**: h-11 (44px), px-8
- **icon**: h-10 w-10 (40x40px square)

**States:**

- Default: Base styling
- Hover: Opacity 90%, scale transform
- Active: Scale 95%
- Disabled: Opacity 50%, pointer-events-none
- Focus: Ring 2px, ring-offset 2px

**Properties:**

```
border-radius: xl (20px)
transition: all 200ms
font-weight: medium
gap: 2 (8px) between icon and text
```

### 2. Card Component

**Base:**

- Background: card hsl(0, 0%, 18%)
- Border: 1px solid border
- Border radius: lg (16px)
- Shadow: sm
- Padding: 24px (p-6)

**Class Modifier:**

- `.card-elevated`: Enhanced shadow and hover effects

**Sub-components:**

- **CardHeader**: Space-y-1.5, p-6
- **CardTitle**: text-2xl, font-semibold
- **CardDescription**: text-sm, text-muted-foreground
- **CardContent**: p-6
- **CardFooter**: p-6, pt-0

### 3. Input Component

**Base:**

- Height: 40px (h-10)
- Border: 1px solid input color
- Border radius: md (14px)
- Padding: px-3 py-2
- Background: background color
- Transition: colors

**States:**

- Focus: ring-2, ring-ring, ring-offset-2
- Disabled: opacity-50, cursor-not-allowed
- Placeholder: text-muted-foreground

### 4. Badge Component

**Variants:**

- **default**: Primary background
- **secondary**: Secondary background
- **destructive**: Red background
- **outline**: Border only

**Base:**

- Border radius: full (pill shape)
- Padding: px-2.5 py-0.5
- Font size: xs (12px)
- Font weight: semibold

### 5. Navigation Component

**Desktop (md+):**

- Width: 256px (w-64)
- Fixed left sidebar
- Height: 100vh
- Padding: 16px
- Background: card with border-r

**Mobile (<md):**

- Bottom fixed navigation
- Height: 80px
- Full width
- Grid layout: 6 columns
- Background: card with border-t

**Nav Items:**

- Icon size: 20x20px (h-5 w-5)
- Padding: px-4 py-3
- Border radius: xl (20px)
- Active state: primary background + glow
- Inactive: muted-foreground, hover muted background

### 6. Dialog/Modal Component

**Overlay:**

- Background: rgba(0, 0, 0, 0.8)
- Backdrop blur
- z-index: 50

**Content:**

- Max width: lg (32rem)
- Background: card
- Border: 1px
- Border radius: lg
- Shadow: lg
- Padding: 24px

**Components:**

- **DialogHeader**: Space-y-1.5, text-center sm:text-left
- **DialogTitle**: text-lg, font-semibold
- **DialogFooter**: flex, gap-2, sm:justify-end

### 7. Select/Dropdown Component

**Trigger:**

- Height: 40px
- Padding: px-3 py-2
- Border: 1px solid border
- Border radius: md
- Flex items-center justify-between
- Icon: chevron-down

**Content:**

- Background: popover
- Border: 1px
- Border radius: md
- Shadow: md
- Max height: 384px (overflow-y-auto)

**Item:**

- Padding: px-2 py-1.5
- Border radius: sm
- Hover: background accent

### 8. Switch Component

**Base:**

- Width: 44px (w-11)
- Height: 24px (h-6)
- Border radius: full
- Border: 2px transparent
- Transition: colors

**States:**

- Unchecked: input background
- Checked: primary background
- Focus: ring-2, ring-ring

**Thumb:**

- Size: 20x20px
- Border radius: full
- Background: white
- Transition: transform 100ms

---

## 📱 Responsive Layout Rules

### Mobile (<768px)

**Layout:**

- Single column
- Bottom navigation (80px height)
- Full-width content
- Padding: 16px (p-4)
- Stack all elements vertically

**Typography:**

- Reduce heading sizes by 1 step
- Minimum touch target: 44x44px
- Line height: 1.5

**Cards:**

- Full width
- Reduced padding (p-4)
- Stack contents vertically

**Charts:**

- Height: 280px
- Responsive container
- Simplified labels

### Tablet (768px - 1024px)

**Layout:**

- Two-column grid where appropriate
- Left sidebar navigation (256px)
- Content margin-left: 256px
- Padding: 24px (p-6)

**Cards:**

- Grid 2 columns for stats
- Maintain spacing

### Desktop (1024px+)

**Layout:**

- Left sidebar: 256px fixed
- Max content width: 1280px (max-w-7xl)
- Center content with mx-auto
- Padding: 32px (p-8)

**Cards:**

- Grid 3 columns for overview stats
- Grid 2 columns for charts
- Full layout hierarchy

---

## 🎨 Figma Frame Structure

### Page: Dashboard

**Desktop Frame (1440x1024px):**

```
Auto-layout: Horizontal
├─ Sidebar (256px)
│  ├─ Brand Header
│  │  ├─ Title "FitTrack"
│  │  └─ Subtitle "Your Workout Companion"
│  └─ Navigation (Auto-layout Vertical, gap: 8px)
│     ├─ Nav Item (Dashboard) [Active]
│     ├─ Nav Item (History)
│     ├─ Nav Item (Exercises)
│     ├─ Nav Item (Reminders)
│     ├─ Nav Item (Stats)
│     └─ Nav Item (Settings)
│
└─ Main Content (1184px flex)
   ├─ Page Header
   │  ├─ Title "Dashboard"
   │  └─ Subtitle "Track your progress..."
   │
   ├─ Overview Stats (Grid 3 columns, gap: 24px)
   │  ├─ Card: Total Workouts (Icon + Number)
   │  ├─ Card: Avg per Week
   │  └─ Card: Consistency
   │
   ├─ Motivation Card (Gradient background)
   │  ├─ Icon: Zap
   │  ├─ Quote text
   │  └─ Decorative elements
   │
   ├─ Start Workout Card
   │  └─ Button "Start New Workout" (centered)
   │
   └─ Recent Workouts (Auto-layout Vertical, gap: 12px)
      ├─ Workout Card 1
      ├─ Workout Card 2
      └─ Workout Card 3
```

**Mobile Frame (375x812px):**

```
Auto-layout: Vertical
├─ Mobile Header (Sticky, 56px)
│  ├─ Brand "FitTrack"
│  └─ Streak Badge
│
├─ Main Content (Scroll)
│  ├─ Page Header
│  │  ├─ Title "Dashboard"
│  │  └─ Subtitle
│  │
│  ├─ Overview Stats (Grid 3 columns, gap: 12px)
│  │  ├─ Card: Total Workouts
│  │  ├─ Card: Avg per Week
│  │  └─ Card: Consistency
│  │
│  ├─ Motivation Card (Full width)
│  │
│  ├─ Start Workout Card
│  │  └─ Button (w-64, centered)
│  │
│  └─ Recent Workouts (Stacked)
│
└─ Bottom Navigation (80px, 6 items)
   ├─ Dashboard [Active]
   ├─ History
   ├─ Exercises
   ├─ Reminders
   ├─ Stats
   └─ Settings
```

### Page: Stats

**Desktop Frame:**

- Two-tab layout (Statistics, Streaks)
- Date range selector (top right)
- 3-column overview cards
- 2-column chart grid (6 charts total)
- Charts: Line, Bar, Pie types
- All charts: 280px height
- Milestone progress cards (2-column)
- Personal records list

**Mobile Frame:**

- Single column
- Stacked charts
- Reduced chart heights
- Scrollable content
- Bottom navigation

### Page: Settings

**Common Elements:**

- Section headers with icons
- Card-based layout
- Toggle switches (11x6px)
- Preference rows with separators
- Action buttons

### Page: Reminders

**Layout:**

- Page header
- Reminder type cards (5 types)
- Each card: Icon + Title + Type Badge + Actions
- Empty state with call-to-action
- Create/Edit dialog with form fields

---

## 🎯 Component Mapping (JSX → Figma)

| JSX Component  | Figma Component    | Properties               |
| -------------- | ------------------ | ------------------------ |
| `<Button>`     | Button/[Variant]   | variant, size, children  |
| `<Card>`       | Card               | children, className      |
| `<Input>`      | Input              | type, placeholder        |
| `<Badge>`      | Badge/[Variant]    | variant, children        |
| `<Switch>`     | Switch             | checked, onCheckedChange |
| `<Dialog>`     | Modal              | open, children           |
| `<Select>`     | Dropdown           | value, options, onChange |
| `<PageHeader>` | Page-Header        | title, subtitle          |
| Navigation     | Sidebar/Bottom-Nav | items[], activeIndex     |

---

## 📊 Auto-Layout Rules

### General Principles:

1. **Use Auto-layout everywhere** for responsive behavior
2. **Spacing Mode**: Use gap property, not padding between items
3. **Resizing**: Set to "Hug contents" or "Fill container" appropriately
4. **Min/Max Width**: Set constraints for responsive scaling

### Specific Rules:

**Sidebar:**

- Direction: Vertical
- Padding: 16px
- Gap: 8px (between nav items)
- Fixed width: 256px

**Card:**

- Padding: 24px
- Gap: 16px (between header and content)
- Border radius: 16px
- Fill container (width), Hug contents (height)

**Button:**

- Padding: 16px horizontal, 10px vertical
- Gap: 8px (icon to text)
- Hug contents (both directions)
- Border radius: 20px

**Grid Layouts:**

- Use "Wrap" layout mode
- Set gap: 24px (desktop), 12px (mobile)
- Set min-width constraints

---

## 🔄 State Variations

### Interactive States (Apply to all clickable elements):

1. **Default**: Base styling
2. **Hover**: Opacity 90% OR background color change
3. **Active/Pressed**: Scale 95%
4. **Focused**: 2px ring with offset
5. **Disabled**: Opacity 50%, grayscale optional

### Component States:

**Button:**

- Default, Hover, Pressed, Disabled
- Each variant has all 4 states

**Input:**

- Empty, Filled, Focus, Error, Disabled

**Card:**

- Default, Hover (if clickable), Active (if selected)

**Navigation Item:**

- Inactive, Hover, Active

---

## 💡 Implementation Notes

### For Figma Import:

1. Create a "Design Tokens" page with all color/typography swatches
2. Build component library first
3. Create frames for each screen (Desktop + Mobile)
4. Use components within frames
5. Set up proper constraints for responsive behavior
6. Test responsive behavior using Figma's preview

### Color Palette Setup:

- Create color styles for all HSL values
- Name them semantically (e.g., "Background/Primary", "Text/Foreground")
- Use "/" separator for hierarchical organization

### Typography Setup:

- Create text styles for all sizes
- Name format: "Size/Weight" (e.g., "2XL/Semibold")
- Apply consistent line heights

### Component Variants:

- Use Figma variants for button types, sizes, states
- Nest variants: Type → Size → State
- This matches the JSX prop structure

---

## 📝 Additional Resources

### Icons:

- Using Lucide React icon set
- Icon sizes: 16px (h-4), 20px (h-5), 24px (h-6)
- Use Iconify plugin in Figma to import Lucide icons
- All icons should be converted to vector for easy color changes

### Charts (Recharts):

- Line charts: 3px stroke width, 5px dots
- Bar charts: 8px border radius on top corners
- Pie charts: 100px outer radius, labels positioned outside
- All charts use dark theme colors from palette
- Tooltip: Dark background, rounded corners, padding 12px

### Animations (Inform developers):

- Transitions: 200ms ease
- Hover scale: transform scale(0.95)
- Fade in: opacity 0 → 1, 300ms
- Slide up: translateY(10px) → 0, 300ms

---

## ✅ Quality Checklist

Before finalizing Figma design:

- [ ] All colors match HSL values exactly
- [ ] Typography uses Inter font family
- [ ] Spacing follows 4px grid system
- [ ] Border radius uses defined scale
- [ ] Components have all necessary variants
- [ ] Auto-layout is used throughout
- [ ] Constraints are set for responsiveness
- [ ] Mobile + Desktop frames for each screen
- [ ] Interactive states are defined
- [ ] Component library is organized
- [ ] Icons are properly vectorized
- [ ] Shadows match CSS definitions

---

**Generated by GitHub Copilot**
**From: FitTrack React + Vite Frontend**
**For: Figma Design System Creation**
