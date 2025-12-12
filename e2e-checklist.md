# SharePlate E2E Testing Checklist

## Authentication Flow Tests
- [ ] Valid email OTP request succeeds
- [ ] Invalid email shows proper error
- [ ] Network error during OTP shows retry option
- [ ] OTP verification with valid code succeeds
- [ ] OTP verification with invalid code shows error
- [ ] Session persists after page reload
- [ ] Logout clears session properly

## Meal Management Tests
- [ ] Create meal with all required fields succeeds
- [ ] Create meal with missing required fields shows validation
- [ ] Image upload with valid file succeeds
- [ ] Image upload with invalid file shows security error
- [ ] Edit own meal updates successfully
- [ ] Delete own meal removes from listings
- [ ] Cannot edit/delete other users' meals

## Search & Discovery Tests
- [ ] Search by meal title returns correct results
- [ ] Search by cook name returns correct results
- [ ] Filter by cuisine type works correctly
- [ ] Filter by dietary restrictions works correctly
- [ ] Location-based filtering works when permission granted
- [ ] Location-based filtering gracefully handles permission denied
- [ ] Empty search results show appropriate message

## Request & Messaging Tests
- [ ] Request meal with valid portions succeeds
- [ ] Request own meal shows appropriate error
- [ ] Request without authentication redirects to login
- [ ] Message sending between users works
- [ ] Message notifications appear correctly
- [ ] Unread message count updates properly

## Mobile & Accessibility Tests
- [ ] All pages render correctly on mobile devices
- [ ] Touch interactions work properly
- [ ] Keyboard navigation works throughout app
- [ ] Screen reader announcements work
- [ ] Focus management works correctly
- [ ] Color contrast meets WCAG standards

## Error Handling Tests
- [ ] JavaScript errors show error boundary instead of white screen
- [ ] Network errors show appropriate retry options
- [ ] Form submission errors show clear feedback
- [ ] Image loading errors show fallback content
- [ ] Offline state shows appropriate message

## Performance Tests
- [ ] Initial page load completes within 3 seconds
- [ ] Images load progressively with proper placeholders
- [ ] Search results appear within 1 second
- [ ] Form submissions complete within 5 seconds
- [ ] No memory leaks during extended usage