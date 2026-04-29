# New Task: Fix Welcome Message, Navigation, Views, Comments for Anonymous Users

## Current Issues
1. Welcome message shows "welcome back null" for anonymous users
2. Navigation shows logout for all logged-in users (including anonymous)
3. Player.jsx has sessionStorage view deduplication (remove it)
4. Comments require login, use real user email, no replies

## Plan
**1. AuthContext.jsx** - Generate random names for anonymous users from predefined list
**2. Navigation.jsx** - Show logout only if `user.role === 'admin'`
**3. Admin.jsx** - Add logout button
**4. Player.jsx** - Remove `hasViewedThisSession` sessionStorage logic
**5. api.js** - Update `addComment` to use random name from AuthContext
**6. Player.jsx** - Allow anonymous comments (remove `if (!user)` check)

## Progress
- [ ] Update AuthContext.jsx for random names
- [ ] Update Navigation.jsx for admin-only logout
- [ ] Add logout to Admin.jsx
- [ ] Remove view deduplication from Player.jsx
- [ ] Update comment system for anonymous users + replies
- [ ] Deploy
