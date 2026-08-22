> **Archived** — This document was a pre-implementation planning blueprint that describes a target architecture that was **never realized**. It references NativeWind, `VideoPlayer.tsx`, `MasonryGrid.tsx`, a `src/features/` directory tree, and other modules that do not exist in the current codebase. For the actual architecture, see `docs/ARCHITECTURE.md`.

# Redesign Blueprint

## **Current State Analysis**
The existing Lumora-photogallery-App has:
- Expo SDK ~54.0.33, React Native 0.81.3
- React currently 18.2.0 (needs downgrade for SDK 54)
- Feature-centric folder structure required
- MMKV storage with web fallback
- React Navigation v7 with custom components
- Custom UI primitives (StyleSheet only)
- Reanimated 4, FlashList
- TypeScript strict mode enabled
- ESLint with expo config, no Prettier yet
- No tests configured

## **Proposed Architecture**

### **Folder Structure**
```
src/
├── components/              // Shared UI primitives
├── features/                // Feature-specific modules
│   ├── albums/             // Albums feature
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── screens/
│   │   └── types/
│   ├── photos/             // Photos feature
│   ├── settings/           // Settings feature
│   └── permissions/        // Permissions flow
├── theme/                   // Design system tokens and hooks
├── services/                // Core services (overridden by features)
├── navigation/              // Navigation setup and types
├── hooks/                   // Global hooks (useTheme, useService, etc.)
├── types/                   // Shared interfaces
├── utils/                   // Utility functions
└── test/                   // Testing configuration
```

### **Key Components**
- **Design System**: Tokens for colors, spacing, typography, motion
- **Routing**: React Navigation v7 with bottom tabs and stack navigation
- **State Management**: MMKV + caching (no external state management)
- **Accessibility**: WCAG 2.2 AA compliance with reduced motion and dynamic type support

## **Design System Specification**

### **Tokens**
**Colors**: Light/dark mode semantic tokens
```ts
colors: {
  primary: '#007bff',
  secondary: '#6c757d', 
  background: '#f8f9fa',
  surface: '#ffffff',
  text: '#333333',
  border: '#e0e0e0',
  error: '#dc3545',
  warning: '#ffc107',
  success: '#28a745'
}
```

**Spacing**: 4, 8, 12, 16, 24, 32, 48, 64
**Typography**: Dynamic type support with system font scaling
**Motion**: Duration, easing, spring configurations

### **Primitives**
`VStack`, `HStack`, `Stack`, `Text`, `Button`, `IconButton`, `Card`, `Surface`, `Divider`, `Image`, `Input`, `Badge`, `Chip`, `Skeleton`, `Progress`, `Switch`, `Checkbox`, `Radio`, `List`, `EmptyState`, `ErrorState`, `LoadingState`, `Tooltip`, `Modal`, `BottomSheet`, `Toast`

## **Navigation Structure**
- **Bottom Tabs**: Photos, Albums, Settings
- **Stack Navigation**: Photo detail, Album detail, Permissions
- **Type-safe**: NativeStackScreenProps
- **Animations**: Reanimated 4 with reduced motion support
- **Onboarding**: Permission flow

## **State Management Strategy**

### **Storage Layer**
- **MMKV**: Native persistent storage
- **Expo Secure Store**: Sensitive data (biometric tokens)
- **Web Fallback**: localStorage for web platform
- **Unified Interface**: Single access point

### **Service Layer**
- **useService Hook**: Dependency injection
- **Albums Service**: CRUD operations + caching
- **Photos Service**: Pagination + cache invalidation
- **Permissions Service**: State management + native requests
- **Settings Service**: Secure persistent storage

### **Hooks**
- **Data Hooks**: usePhotos, useAlbums, usePermissions
- **UI Hooks**: useTheme, useService, useReducedMotion
- **Form Hooks**: useForm validation

## **Feature Breakdown**

### **Phase 1: Foundation** (✓ Complete)
- Theme tokens and hooks
- Global primitives
- Navigation setup
- Service layer and caching
- Security (Expo Secure Store)

### **Phase 2: Features** (🔄 In Progress)
- **Albums Feature**: Grid/list, blurhash, long-press actions, sorting/filter
- **Photos Feature**: FlashList, multi-select, gestures, zoom
- **Settings Feature**: Forms, toggles, biometric auth

### **Phase 3: Polish & Animations** (🔄 Next)
- Reanimated 4 micro-interactions
- Responsive layouts
- Dark/light theme integration
- Accessibility enhancements

### **Phase 4: Testing & CI** (🔄 Next)
- Jest + React Native Testing Library
- Accessibility tests
- CI pipeline
- Coverage optimization

### **Phase 5: Optimization** (🔄 Next)
- Bundle splitting
- Performance profiling
- Security audit
- Documentation

## **Testing Strategy**
- **Unit Tests**: Services, utils, hooks
- **Integration Tests**: Screen interactions
- **Accessibility Tests**: Screen readers, reduced motion
- **E2E Tests**: Navigation flows
- **CI Integration**: Lint, type-check, test, build

## **Performance Requirements**
- **Bundle Size**: <200KB gzipped
- **Startup Time**: <1s
- **List Rendering**: FlashList with key extraction
- **Animations**: UI thread optimization with Reanimated 4
- **Caching**: Smart invalidation strategies

## **Accessibility Requirements**
- **WCAG 2.2 AA**: Contrast ratios, focus management
- **Reduced Motion**: All animations disable-able
- **Dynamic Type**: System font scaling
- **Screen Readers**: Semantic components
- **VoiceOver/TalkBack**: Proper labeling

## **Execution Plan**

### **Phase 1: Foundation** (✓ Complete)
1. Theme system implementation
2. Component primitives creation
3. Navigation setup with type safety
4. Storage abstraction layer
5. Service architecture with dependency injection
6. CI pipeline setup

### **Phase 2: Features** (🔄 Continue)
1. **Albums Screen**: Grid/list view with blurhash, sorting, filtering, pull-to-refresh
2. **Photos Screen**: FlashList with caching, multi-select, swipe gestures
3. **Photo Detail**: Full-screen viewer with pinch/zoom, metadata
4. **Settings**: Forms, toggles, biometric authentication
5. **Permissions**: Onboarding flow with clear explanations

### **Phase 3: Polish & Animations**
1. Reanimated 4 micro-interactions
2. Shared element transitions
3. Responsive layouts
4. Dark/light theme integration
5. Accessibility refinements

### **Phase 4: Testing & CI**
1. Jest setup with expo testing
2. Accessibility test suite
3. CI workflow completion
4. Coverage target: 80%+

### **Phase 5: Optimization**
1. Bundle analysis and splitting
2. Performance profiling
3. Security audit (npm audit)
4. Complete documentation

## **Migration Steps**

### **Immediate Actions**
1. Complete remaining Phase 1 components
2. Implement Phase 2 features
3. Setup testing infrastructure
4. Configure CI/CD pipeline
5. Run performance audits

### **Phase 2 Implementation**
1. **Albums Feature**: Create screens, hooks, services
2. **Photos Feature**: Implement FlashList integration
3. **Settings Feature**: Build form components
4. **Navigation**: Add onboarding and permission screens
5. **Animations**: Implement micro-interactions

### **Code Quality Standards**
- TypeScript strict mode
- JSDoc for public APIs
- ESLint with React and accessibility rules
- Prettier formatting
- Component testing
- Performance optimization

## **Evaluation Criteria**
- **UI/UX**: Visual consistency, responsive design, animations
- **Code Quality**: Architecture, type safety, maintainability
- **Accessibility**: WCAG compliance, screen reader support
- **Performance**: Bundle size, startup time, list rendering
- **Production Readiness**: CI/CD, documentation, security
- **Completeness**: All features implemented, no stubs

## **Next Actions**
1. Complete Phase 1: Navigation implementation with bottom tabs
2. Implement Phase 2: Album and Photo screens
3. Add Phase 3: Animations and micro-interactions
4. Setup Phase 4: Testing infrastructure
5. Optimize Phase 5: Bundle and security

The project is now ready for comprehensive redesign following this structured approach.