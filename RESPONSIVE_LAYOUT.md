# Responsive Dashboard Layout Documentation

## Overview
Implemented a modern, responsive dashboard layout with a navbar, collapsible sidebar, and settings panel. The design is fully responsive and works seamlessly across mobile, tablet, and desktop devices.

## Components

### 1. Navbar (`Navbar.tsx`)
A fixed top navigation bar that adapts to different screen sizes.

**Features:**
- Fixed position at the top of the screen
- Logo with chat icon
- Hamburger menu for mobile (toggles sidebar)
- User avatar with dropdown trigger
- Responsive: Shows/hides elements based on screen size

**Props:**
- `onToggleSidebar: () => void` - Callback to toggle sidebar
- `onToggleSettings: () => void` - Callback to toggle settings panel
- `isSidebarOpen: boolean` - Current sidebar state

**Responsive Breakpoints:**
- Mobile (<640px): Hamburger menu visible, username hidden
- Tablet (640px - 1024px): Username visible, sidebar can be toggled
- Desktop (>1024px): Full layout with persistent sidebar

### 2. Sidebar (`Sidebar.tsx`)
A collapsible navigation sidebar with menu items.

**Features:**
- Collapsible on mobile/tablet
- Fixed on desktop (lg breakpoint)
- Menu items with icons and badges
- User profile section (mobile only)
- Online status indicator
- Smooth slide-in/out animation

**Props:**
- `isOpen: boolean` - Whether sidebar is open
- `onClose: () => void` - Callback to close sidebar

**Menu Items:**
- Dashboard (active)
- Messages (with badge count)
- Friends
- Groups
- Settings
- Help & Support

**Responsive Behavior:**
- Mobile/Tablet: Overlay sidebar, closes on outside click
- Desktop: Always visible, pushes content to the right

### 3. SettingsPanel (`SettingsPanel.tsx`)
A sliding panel from the right side containing all settings.

**Features:**
- Slides in from the right
- Contains multiple setting categories
- Theme toggle (light/dark mode)
- Change password integration
- User profile display
- Logout button
- Smooth animations

**Sections:**
1. **User Profile** - Avatar, username, email, verification status
2. **Appearance** - Theme toggle (light/dark mode)
3. **Account** - Change password, edit profile, notifications
4. **Privacy & Security** - Privacy settings, blocked users
5. **Logout** - Sign out button

**Props:**
- `isOpen: boolean` - Whether panel is open
- `onClose: () => void` - Callback to close panel
- `onLogout: () => void` - Callback for logout

### 4. Dashboard (Updated)
Main content area with responsive grid layout.

**Features:**
- Responsive stats grid (1-4 columns)
- User information card
- Quick actions panel
- Welcome message
- Adapts layout for mobile/tablet/desktop

**Layout Sections:**
- Welcome header with greeting
- 4-card stats grid (messages, chats, friends, unread)
- Account information card (2/3 width on desktop)
- Quick actions card (1/3 width on desktop)
- Welcome message banner

## Responsive Design

### Mobile (< 640px)
- Single column layout
- Hamburger menu for navigation
- Overlay sidebar (full width or 320px)
- Settings panel (full width)
- Stats cards stacked vertically
- Simplified navbar (hide username)

### Tablet (640px - 1024px)
- 2-column stats grid
- Sidebar toggleable with overlay
- Settings panel (384px wide)
- Show username in navbar
- Improved spacing

### Desktop (> 1024px)
- 4-column stats grid
- Persistent sidebar (256px)
- Settings panel (384px)
- Full navbar with all elements
- Optimal spacing and padding
- Content offset by sidebar width

## Color Scheme

### Light Mode
- Background: Gray-50
- Cards: White with gray-200 borders
- Text: Gray-900 primary, gray-600 secondary
- Sidebar: White
- Navbar: White

### Dark Mode
- Background: Gray-900
- Cards: Gray-800 with gray-700 borders
- Text: White primary, gray-300 secondary
- Sidebar: Gray-800
- Navbar: Gray-800

## Icons
All icons use Heroicons (Tailwind's default icon set) with consistent sizing:
- Small icons: w-4 h-4
- Medium icons: w-5 h-5
- Large icons: w-6 h-6

## Animations
- Sidebar slide: `transform translate-x-0/translate-x-full`, 200ms ease-in-out
- Settings panel slide: `transform`, 300ms ease-in-out
- Overlay fade: `opacity`, 200ms
- All transitions use `transition-colors duration-200` for theme changes

## Accessibility

### Keyboard Navigation
- Tab navigation works throughout
- Focus states visible on all interactive elements
- Escape key closes modals (to be implemented)

### ARIA Labels
- Hamburger menu: `aria-label="Toggle sidebar"`
- Settings button: `aria-label="Open settings"`
- Close buttons: `aria-label="Close settings"`

### Screen Readers
- Semantic HTML structure
- Proper heading hierarchy
- Descriptive button text

## State Management
Dashboard manages three states:
1. `isSidebarOpen` - Sidebar visibility (mobile/tablet only)
2. `isSettingsOpen` - Settings panel visibility
3. Theme state - Managed by ThemeContext

## Mobile-First Approach
Built with mobile-first responsive design:
1. Base styles for mobile
2. `sm:` prefix for tablets (640px+)
3. `lg:` prefix for desktops (1024px+)
4. Progressive enhancement

## Performance Optimizations
- Conditional rendering of overlay
- CSS transitions instead of JavaScript animations
- Minimal re-renders with proper state management
- Lazy loading of components (can be added)

## Browser Compatibility
- Modern browsers (Chrome, Firefox, Safari, Edge)
- CSS Grid and Flexbox
- Tailwind CSS utilities
- No IE11 support required

## Future Enhancements
1. Add keyboard shortcuts (Ctrl+K for search, etc.)
2. Implement escape key to close panels
3. Add swipe gestures for mobile
4. Persist sidebar state in localStorage
5. Add search functionality
6. Implement notification center
7. Add user status selector
8. Add theme customization options

## Usage Example

```tsx
import Dashboard from './components/Dashboard';

function App() {
  const handleLogout = () => {
    // Logout logic
  };

  return <Dashboard onLogout={handleLogout} />;
}
```

## Component Tree
```
Dashboard
├── Navbar
│   └── User Avatar (triggers settings)
├── Sidebar
│   ├── Menu Items
│   ├── User Profile (mobile)
│   └── Status Indicator
├── SettingsPanel
│   ├── User Profile Section
│   ├── Appearance (Theme Toggle)
│   ├── Account Settings
│   │   └── ChangePassword Modal
│   ├── Privacy & Security
│   └── Logout Button
└── Main Content
    ├── Welcome Section
    ├── Stats Grid
    ├── Account Info Card
    ├── Quick Actions
    └── Welcome Message
```

## Testing Checklist

### Mobile (< 640px)
- [ ] Hamburger menu opens/closes sidebar
- [ ] Sidebar overlays content
- [ ] Settings panel is full width
- [ ] Stats cards stack vertically
- [ ] All text is readable
- [ ] No horizontal scrolling

### Tablet (640px - 1024px)
- [ ] Sidebar toggles with overlay
- [ ] Settings panel width is 384px
- [ ] Stats grid shows 2 columns
- [ ] Navigation is accessible
- [ ] Layout looks balanced

### Desktop (> 1024px)
- [ ] Sidebar is always visible
- [ ] Content shifts right by 256px
- [ ] Stats grid shows 4 columns
- [ ] All features accessible
- [ ] Smooth transitions

### Dark Mode
- [ ] Theme toggles correctly
- [ ] All colors update
- [ ] Contrast is sufficient
- [ ] Icons are visible
- [ ] Gradients work well

### Interactions
- [ ] Sidebar opens/closes smoothly
- [ ] Settings panel slides in/out
- [ ] Overlays close on click
- [ ] Theme persists on refresh
- [ ] Change password modal works
- [ ] Logout functions properly

## File Structure
```
frontend/src/components/
├── Navbar.tsx              # Top navigation bar
├── Sidebar.tsx             # Left navigation sidebar
├── SettingsPanel.tsx       # Right settings panel
├── Dashboard.tsx           # Main dashboard (updated)
├── ChangePassword.tsx      # Password change modal
└── ThemeToggle.tsx         # Theme toggle (used in settings)
```

## Dependencies
- React 18+
- React Router DOM
- Tailwind CSS 3+
- ThemeContext (custom)
- authService (custom)

## Styling Guidelines

### Spacing
- Small: `p-2`, `space-x-2` (0.5rem)
- Medium: `p-4`, `space-x-4` (1rem)
- Large: `p-6`, `space-x-6` (1.5rem)

### Borders
- Subtle: `border-gray-200 dark:border-gray-700`
- Radius: `rounded-lg` (0.5rem)

### Shadows
- Cards: `shadow-sm`
- Navbar: `shadow-sm`
- Panels: `shadow-2xl`

### Z-Index
- Navbar: `z-40`
- Sidebar overlay: `z-30`
- Settings panel: `z-50`
- Modals: `z-[60]`
