# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FitSpark is a comprehensive fitness tracking and social platform built with **vanilla JavaScript (ES6+)**, using no frameworks. It features workout logging, nutrition tracking, social features, AI-powered recommendations, and real-time performance monitoring. The entire application runs client-side with localStorage persistence.

## Development Commands

### Essential Commands

```bash
# Start development server (serves on http://localhost:3000)
npm run dev

# Run all tests (200+ tests, ~1.7s execution)
npm test

# Run specific test suites
npm run test:unit          # Unit tests only (135 tests)
npm run test:integration   # Integration tests only (65 tests)

# Watch mode for TDD
npm run test:watch

# Generate coverage report (target: 93%+)
npm run test:coverage

# View coverage in browser
open coverage/index.html
```

### Testing Specific Files

```bash
# Run single test file
npx vitest run tests/unit/storage.test.js

# Run tests matching pattern
npx vitest run tests/unit/auth

# Run tests in UI mode for debugging
npm run test:ui
```

## Architecture Overview

### Core Design Patterns

1. **SPA with History API Router**: The application uses a custom router (`router.js`) with History API for true SPA navigation. All pages are lazy-loaded views, reducing initial bundle size by ~85%.

2. **View-Based Architecture**: Each route maps to a View file (in `views/`) that defines a `template()` function and lifecycle hooks (`mount()`, `unmount()`). Views dynamically import their required modules on mount.

3. **IIFE Module Pattern**: All modules use Immediately Invoked Function Expressions for encapsulation and expose public APIs via return statements.

4. **Event-Driven Architecture**: The `eventBus` service (pub/sub pattern) decouples modules. All cross-module communication happens through events, not direct imports.

5. **Service Layer Separation**: Business logic lives in `services/`, UI logic in `modules/`. Services never import modules; modules import services.

6. **LocalStorage as Database**: All data persists in localStorage via the `storage` service abstraction. No backend required.

### Module Communication Flow

```
User Action → Module → Service → Storage → EventBus.emit()
                ↓                              ↓
            Update UI ←────────────────── EventBus.on()
```

**Example**: When a workout is logged:
1. `workoutModule` calls `storage.save()`
2. `workoutModule` emits `EventNames.WORKOUT_COMPLETED`
3. `activityFeedModule`, `analyticsModule`, `leaderboardModule` listen and auto-update

### Critical Services

- **router.js**: History API-based router with route guards, lazy loading, and 404 handling. Use `Router.push(path)` for navigation.
- **eventBus.js**: Central event system. Always use `EventNames` constants, never string literals.
- **storage.js**: LocalStorage wrapper with JSON serialization. All data access goes through this. Uses namespaced keys (`fitspark:users`, `fitspark:session`).
- **authService.js**: Manages authentication state. Current user stored in `storage.get('fitspark:session')`.
- **performanceMonitor.js**: Tracks Core Web Vitals (FCP, FID, CLS). Initialized in `app.js`.
- **lazyLoader.js**: Handles dynamic imports and lazy loading. Use for heavy modules.

### Data Flow Conventions

1. **User Isolation**: All user-generated data includes a `userId` field. Filter by `authService.currentUser().id`.
2. **Timestamps**: Use ISO format: `new Date().toISOString()`
3. **IDs**: Use `Date.now()` or `crypto.randomUUID()` for uniqueness.

### View Structure

Each view follows this pattern:
```javascript
export const ViewName = {
  template: (params) => `<section>HTML template here</section>`,

  mount: async (params) => {
    // Dynamically import required modules
    const { moduleName } = await import('../modules/module.js');
    moduleName.init();
    console.log('ViewName mounted');
  },

  unmount: () => {
    // Cleanup: remove event listeners, timers, etc.
    console.log('ViewName unmounted');
  }
};
```

### Module Structure

Each module follows this pattern:
```javascript
export const moduleName = (() => {
  // Private variables
  let state = {};

  // Private functions
  const privateFunc = () => {};

  // Public API
  const init = () => {};
  const render = () => {};

  return { init, render }; // Only expose what's needed
})();
```

### Key Architectural Decisions

1. **No DOM in Services**: Services never touch the DOM. That's module responsibility.
2. **No Direct Module-to-Module Calls**: Use eventBus for cross-module communication.
3. **Stateless Services**: Services don't maintain UI state. They provide functions and emit events.
4. **Performance First**: Use debouncing for search/scroll, lazy loading for heavy features, memoization for expensive calculations.

## Code Organization

```
src/assets/js/
├── app.js                 # Entry point, initializes router and routes
├── router.js              # History API router with guards and lazy loading
├── components/
│   └── Navigation.js     # Navigation component with highlight logic
├── views/                 # Route views (lazy-loaded)
│   ├── HomeView.js       # Welcome page
│   ├── AuthView.js       # Login/register
│   ├── ProfileView.js    # Personal profile (requires auth)
│   ├── HealthView.js     # Body metrics
│   ├── WorkoutsView.js   # Training courses
│   ├── CalendarView.js   # Training calendar
│   ├── NutritionView.js  # Nutrition log
│   ├── FriendsView.js    # Friends list
│   ├── FeedView.js       # Activity feed
│   ├── ForumView.js      # Community forum
│   ├── AnalyticsView.js  # Data analytics
│   ├── LeaderboardView.js # Rankings
│   └── RoadmapView.js    # Development roadmap
├── services/              # Business logic, no DOM manipulation
│   ├── storage.js        # LocalStorage abstraction (namespaced keys)
│   ├── authService.js    # Authentication & user management
│   ├── eventBus.js       # Pub/sub event system
│   ├── oauthService.js   # Third-party OAuth (GitHub/Google/Facebook)
│   ├── calendarService.js # ICS calendar generation
│   └── socialShareService.js # Social media integration
├── modules/               # UI components & feature logic (loaded by views)
│   ├── authUI.js         # Login/register forms
│   ├── workouts.js       # Workout logging
│   ├── nutrition.js      # Nutrition tracking
│   ├── friends.js        # Social features
│   ├── leaderboard.js    # Rankings
│   ├── forum.js          # Community discussions
│   ├── analytics.js      # Data visualizations
│   └── shareCard.js      # Achievement sharing
├── utils/                 # Pure utility functions
│   ├── lazyLoader.js     # Dynamic imports, lazy loading
│   ├── performanceMonitor.js # Performance tracking
│   ├── debounce.js       # Event optimization utilities
│   └── exporter.js       # CSV/JSON data export
└── data/                  # Mock data for development
```

## Testing Architecture

- **Unit Tests**: Test services and utilities in isolation with mocked dependencies.
- **Integration Tests**: Test complete workflows (e.g., register → login → update profile).
- **Test Setup**: `tests/setup.js` mocks localStorage, clipboard API, Web Share API, etc.
- **Coverage Target**: 93%+ overall (97% for services, 89% for integration).

### Writing Tests

```javascript
// Unit test pattern
describe('Service Name', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should do specific thing', () => {
    // Arrange, Act, Assert
  });
});

// Integration test pattern
describe('Complete Workflow', () => {
  beforeEach(() => {
    localStorage.clear();
    eventBus.events = {};
  });

  it('should handle full user flow', () => {
    // Test cross-module interactions
  });
});
```

## Performance Optimization

The codebase uses multiple performance strategies:

1. **Lazy Loading**: Heavy modules loaded on-demand via `lazyLoader.loadModule()`
2. **Debouncing**: Search inputs, form validation use `debounce()` from `utils/debounce.js`
3. **Throttling**: Scroll/resize events use `throttle()` or `rafThrottle()`
4. **Memoization**: Expensive calculations cached with `memoize()`
5. **Image Lazy Loading**: `lazyLoader.lazyLoadImages('img[data-src]')` in app initialization

### Performance Monitoring

```javascript
// Mark important points
performanceMonitor.mark('operation-start');
// ... operation ...
performanceMonitor.mark('operation-end');
performanceMonitor.measure('operation', 'operation-start', 'operation-end');

// Or use timer
const timer = performanceMonitor.startTimer('Database Query');
await query();
timer.stop(); // Logs duration
```

## Routing and Navigation

### Route Structure

The application has a hierarchical route structure with four main centers:

```
/ (Home)
├── /auth (Login/Register)
├── /personal (Personal Center)
│   ├── /personal/profile (requires auth)
│   └── /personal/health
├── /training (Training Center)
│   ├── /training/workouts
│   ├── /training/calendar
│   └── /training/nutrition
├── /social (Social Center)
│   ├── /social/friends
│   ├── /social/feed
│   └── /social/forum
├── /data (Data Center)
│   ├── /data/analytics
│   └── /data/leaderboard
└── /roadmap (Development Roadmap)
```

### Programmatic Navigation

```javascript
import { Router } from './router.js';

// Navigate to a route
Router.push('/training/workouts');

// Replace current route (no history entry)
Router.replace('/auth');

// Go back
Router.back();

// Go forward
Router.forward();

// Get current path
const currentPath = Router.getCurrentPath();
```

### Creating Links

Always use `data-link` attribute for internal navigation:

```html
<a href="/social/friends" data-link>View Friends</a>
```

### Route Guards

Global route guard is configured in `app.js`:

```javascript
Router.beforeEach((to, from) => {
  // Check authentication
  if (to.meta?.requiresAuth && !authService.currentUser()) {
    return '/auth'; // Redirect to login
  }
});
```

Per-route guards can be defined in route config:

```javascript
{
  path: '/personal/profile',
  view: () => import('./views/ProfileView.js'),
  meta: { requiresAuth: true },
  beforeEnter: (to, from) => {
    // Custom guard logic
    if (!hasPermission()) return '/';
  }
}
```

### Adding New Routes

1. Create a view file in `src/assets/js/views/NewView.js`
2. Register the route in `app.js`:

```javascript
{
  path: '/new-feature',
  view: () => import('./views/NewView.js'),
  meta: { requiresAuth: false }
}
```

3. (Optional) Add to Navigation.js for nav links

### Handling Success Callbacks in Views

When views need to redirect after successful operations (like login/register), always pass a callback to modules:

```javascript
mount: async () => {
  const { authUI } = await import('../modules/authUI.js');
  const { Router } = await import('../router.js');

  const handleAuthSuccess = () => {
    Router.push('/'); // Redirect after successful auth
  };

  authUI.mount(container, handleAuthSuccess);
}
```

**Common Pitfall**: Forgetting to pass the `onSuccess` callback to modules like `authUI.mount()` will prevent navigation after successful operations.

## Event Bus Usage

Always use `EventNames` constants from `services/eventBus.js`:

```javascript
import { eventBus, EventNames } from '../services/eventBus.js';

// Register listener
eventBus.on(EventNames.WORKOUT_COMPLETED, (data) => {
  // Handle event
});

// Emit event
eventBus.emit(EventNames.WORKOUT_COMPLETED, { workout });

// One-time listener
eventBus.once(EventNames.AUTH_LOGIN, (data) => {
  // Runs once
});

// Cleanup on destroy
eventBus.off(EventNames.WORKOUT_COMPLETED, callback);
```

**Available Event Names**: See `EventNames` object in `eventBus.js` for complete list (20+ predefined events).

## Data Storage Patterns

### Reading Data

```javascript
import { storage } from '../services/storage.js';

// With default value
const workouts = storage.get('workouts', []);

// Check existence
if (storage.has('user_preferences')) {
  // ...
}
```

### Writing Data

```javascript
// Save data
storage.save('workouts', workouts);

// Remove data
storage.remove('old_key');

// Clear all (use sparingly)
storage.clear();
```

### User-Scoped Data

```javascript
import { authService } from '../services/authService.js';

const userId = authService.currentUser()?.id;

// Filter by user
const userWorkouts = storage.get('workouts', [])
  .filter(w => w.userId === userId);

// Save with userId
const workout = {
  id: Date.now(),
  userId,
  // ... other fields
};
```

## OAuth Integration

The OAuth flow is **mocked** for development (no real backend):

```javascript
import { oauthService } from '../services/oauthService.js';

// Initiate OAuth (simulates redirect)
oauthService.authorize('github'); // or 'google', 'facebook'

// Handle callback (simulated)
const user = oauthService.handleCallback('github', state, code);

// Get available providers
const providers = oauthService.getProviders();
```

**Real Implementation**: Replace mock functions in `oauthService.js` with actual OAuth URLs and token exchange.

## Social Sharing

```javascript
import { socialShareService } from '../services/socialShareService.js';

// Smart share (uses native API on mobile)
await socialShareService.smartShare({
  title: 'My Achievement',
  text: 'I completed 100 workouts!',
  url: window.location.href
});

// Platform-specific
socialShareService.shareToTwitter(content);
socialShareService.shareToFacebook(content);
socialShareService.shareToWeibo(content);

// Get share statistics
const stats = socialShareService.getShareStats();
```

## Calendar Export

```javascript
import { calendarService } from '../services/calendarService.js';

// Export all workouts
calendarService.exportWorkoutCalendar({
  filename: 'my-workouts.ics'
});

// Export with date range
calendarService.exportWorkoutCalendar({
  dateRange: { start: '2025-01-01', end: '2025-01-31' },
  filename: 'january-workouts.ics'
});

// Generate Google Calendar URL
const url = calendarService.generateGoogleCalendarUrl(event);
```

## Common Pitfalls

1. **Don't bypass storage service**: Never use `localStorage.setItem()` directly. Use `storage.save()`. Storage keys are namespaced (e.g., `fitspark:users`, `fitspark:session`).

2. **Don't forget userId**: When creating user data, always include `userId: authService.currentUser().id`.

3. **Don't use string event names**: Use `EventNames.WORKOUT_COMPLETED`, not `'workout:completed'`.

4. **Don't import modules from services**: Services can import other services, but never modules.

5. **Don't forget to cleanup**: Remove event listeners in view `unmount()` functions and module destroy/cleanup functions.

6. **Don't forget onSuccess callbacks**: When mounting modules that handle auth or forms, always pass an `onSuccess` callback for post-action navigation (see `AuthView.js:30`).

7. **Don't use plain links without data-link**: Internal navigation links must include `data-link` attribute: `<a href="/path" data-link>Link</a>`.

8. **Password security**: Use `authService.hashPassword()` before storing. Never store plain text passwords.

## Debugging

### Performance Issues

```javascript
// Generate performance report
const report = performanceMonitor.generateReport();
console.log(report);

// Get performance score
const score = performanceMonitor.getScore(); // 0-100

// Get recommendations
const tips = performanceMonitor.getRecommendations();
```

### Event Bus Debugging

```javascript
// Enable debug mode in eventBus.js
eventBus.debug = true;

// Wildcard listener catches all events
eventBus.on('*', (eventName, data) => {
  console.log(`Event: ${eventName}`, data);
});
```

### Storage Inspection

```javascript
// View all stored keys
console.log(Object.keys(localStorage));

// Check storage size
const size = JSON.stringify(localStorage).length;
console.log(`Storage size: ${(size / 1024).toFixed(2)} KB`);
```

## Documentation

- **[TESTING.md](docs/TESTING.md)**: Complete testing guide with examples
- **[PERFORMANCE.md](docs/PERFORMANCE.md)**: Performance optimization strategies
- **[DEPLOYMENT.md](docs/DEPLOYMENT.md)**: CI/CD and deployment instructions
- **[EVENT_BUS_GUIDE.md](docs/EVENT_BUS_GUIDE.md)**: Event system documentation
- **[ROUTER_MIGRATION_GUIDE.md](ROUTER_MIGRATION_GUIDE.md)**: Router architecture and migration details

## CI/CD

GitHub Actions workflows in `.github/workflows/`:
- **ci.yml**: Runs on every push (lint, test, build, security, performance)
- **deploy.yml**: Deploys to production on main branch

Both workflows are configured to be secure and don't use untrusted user inputs.
