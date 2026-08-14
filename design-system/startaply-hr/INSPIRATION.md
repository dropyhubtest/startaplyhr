# Design Inspiration Research & Evidence Matrix

> **Project:** Startaply HR Portal  
> **Date:** 2026-08-14  
> **Target Aesthetic:** Premium Enterprise SaaS (Linear + Vercel + Attio + Rippling + Notion Inspired)

---

## Evidence Matrix

| Site | Key Observed Pattern | Why It Works | Adapt As (Startaply HR) | Avoid Copying |
|---|---|---|---|---|
| **Linear** (`linear.app`) | Dense, keyboard-first navigation with status left-accent indicators, subtle border highlights, and zero layout shift. | Enables rapid power-user workflows and high data density without visual clutter. | Left accent bar indicator for active sidebar items (`w-1 h-6 rounded-r-full`), `⌘K` global search bar trigger, and crisp status dot indicators. | Dark mode default palette, exact keyboard shortcut keybindings, exact Linear icon styling. |
| **Vercel** (`vercel.com`) | Clean metric cards with multi-layered subtle shadows, analytics visualization, and high contrast typography. | Delivers immediate, readable status feedback with premium corporate polish. | Elevating dashboard stat cards with multi-layered CSS shadows (`var(--shadow-md)`), gradient metric icons, and status pill badges. | Dark tech aesthetic, deployment status indicators, exact Vercel font choices. |
| **Attio** (`attio.com`) | Sophisticated navy/slate color palette, vibrant gradient icon boxes, and multi-layered elevation depth. | Creates a rich, tactile feeling of depth and elegance for B2B relationship data. | Rounded-xl gradient icon boxes (`from-indigo-500 to-blue-600`), warm slate neutrals (`--neutral-50` to `--neutral-950`), and subtle hover lifts. | Exact Attio CRM schema, pink/purple neon gradients, exact Attio brand assets. |
| **Rippling** (`rippling.com`) | Structured employee data tables, comprehensive profile tabs, and multi-step wizard onboarding. | Reduces complexity in dense workforce management while keeping key actions accessible. | Tabbed employee profile view (Personal, Address, Emergency Contact, Assets), 5-step onboarding wizard, and clear table action buttons. | Exact Rippling brand identity, proprietary payroll forms, exact Rippling layout geometry. |
| **Notion** (`notion.so`) | Clean minimalist forms, clear typographic hierarchy, and friendly empty states with visual illustrations. | Makes data entry effortless while preventing overwhelming form complexity. | High-contrast input focus rings (`focus:ring-4 focus:ring-indigo-500/10`), structured section dividers, and gradient empty state containers. | Notion block-editor interaction, canvas layout, exact Notion illustrations. |

---

## Synthesized Core Design Principles

1. **Restrained Elegance & Purposeful Depth**: Use multi-layered CSS shadows (`--shadow-sm` through `--shadow-2xl`) and glass morphism (`backdrop-filter: blur(12px)`) rather than flat borders or heavy dropshadows.
2. **Tactile & Fluid Micro-Interactions**: All interactive elements respond instantly with scale transforms (`active:scale-[0.97]`), 150-250ms cubic-bezier transitions, and smooth hover lifts (`hover:-translate-y-0.5`).
3. **Data-Dense Yet Legible**: Maintain clean typographic hierarchy using `Inter` for interface copy and `JetBrains Mono` for IDs, times, and tabular numbers.
