## 2025-05-15 - [Accessibility for Hidden-on-Hover Buttons]
**Learning:** Elements that use `opacity-0 group-hover:opacity-100` are completely inaccessible to keyboard users and screen readers unless they also have `focus-visible:opacity-100`. This is a common pattern in chat apps for "delete" or "remove" actions that can be easily fixed to improve inclusivity.
**Action:** Always pair `group-hover:opacity-100` with `focus-visible:opacity-100` and ensure icon-only buttons have descriptive `aria-label` attributes in the application's primary language.
