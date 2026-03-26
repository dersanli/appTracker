---
name: react-hook-form edit form pattern
description: Use the `values` option in useForm to sync external data into edit forms — not useEffect+reset
type: feedback
---

Use react-hook-form v7's `values` option to populate edit forms from async data, not `useEffect` + `form.reset()`.

**Why:** `form.reset()` in a useEffect doesn't reliably update Radix Select display values — the controlled component re-renders before the reset lands. The `values` option syncs the form state directly when the data reference changes.

**How to apply:**
```tsx
const form = useForm<FormValues>({
  resolver: zodResolver(schema),
  defaultValues,
  values: existing ? { ...mapExistingToFormValues(existing) } : undefined,
})
// No useEffect needed
```
