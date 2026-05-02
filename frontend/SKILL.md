---
name: pipai-design
description: Use this skill to generate well-branded interfaces and assets for PIPAi (기업 맞춤 개인정보보호 컨설팅 AI), either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read the README.md file within this skill, and explore the other available files.

PIPAi is a Korean conversational AI service that helps small-business owners comply with the Personal Information Protection Act (개인정보보호법). The brand sits in the trust register of Korean public-sector design — navy + scarce red + warm gray, Pretendard for Korean, Space Grotesk for the wordmark — paired with a softer conversational shell.

Core files:
- `colors_and_type.css` — all design tokens (color scales, semantic vars, type ramp, spacing, radii, shadows, motion easing).
- `assets/` — logos (`logo-primary.svg`, `logo-mark.svg`, `logo-mono-white.svg`, `logo-mono-blue.svg`, `pixel-motif.svg`).
- `preview/` — small specimen cards documenting every token cluster.
- `ui_kits/pipai-app/` — high-fidelity React components for the chat product (Sidebar, RiskPanel, ChatThread, LawCard, CaseCard, Composer, Welcome, Login, Topbar) plus an interactive `index.html` demo.

Brand non-negotiables:
- **Red is scarce.** Use only for the logo's i-dot, the chat avatar's red square, and `severity = high` risk markers. Never decoratively.
- **No emoji** in product chrome or chat copy.
- **No gradients, no glassmorphism** in product surfaces. Only blurs allowed: 8px on modal scrim, 12px on mobile composer bottom-bar.
- **Korean tone**: 합쇼체 (-습니다 / -해요 mix), warm-formal, lead with reassurance before warnings, cite law articles as `제○○조` not `§`.
- **Easing**: `cubic-bezier(0.22, 1, 0.36, 1)`, 200ms default. No spring overshoot.

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand.

If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.
