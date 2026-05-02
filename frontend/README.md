# PIPAi Design System

> 기업 맞춤 개인정보보호 컨설팅 AI 웹 서비스
> *Custom Personal Information Protection (PIPA) Consulting AI for Korean SMBs.*

PIPAi is a conversational AI web service that helps Korean small-business owners — who typically have **no legal background** — understand and comply with the **Personal Information Protection Act (개인정보보호법, PIPA)**. The product is a Claude/ChatGPT-style chat with a sidebar that maintains a **real-time risk checklist** for the user's business. AI replies cite specific **law articles (조문)** and surface **case precedents (판례)** as inline cards.

The brand sits in the trust register of Korean public-sector / regulatory design — it pairs the navy + red + grey palette of the **개인정보보호위원회 (Personal Information Protection Commission)** with a softer, friendlier conversational shell so a non-lawyer feels guided, not interrogated.

---

## Sources & inputs given

- `uploads/pipai-primary-red-dot.svg` — the primary logo (pixel-block "P" mark + "PIPAi" wordmark, with the trailing **i** dot rendered as the GOK-red square block).
- Brand colors specified by the user: **GOK Blue `#003764`**, **GOK Red `#E4032E`**, **GOK Gray `#575757`**.
- Product description: conversational AI chat (similar to Claude/ChatGPT layout), sidebar nav with real-time risk checklist, chat messages with law article references and case cards, Korean-language UI, audience of Korean SMB owners with no legal knowledge.
- Tone direction: **trustworthy, approachable, not intimidating.**

> ⚠ No codebase, Figma file, or production screenshots were attached. The component-level decisions in this system are inferred from (a) the geometric pixel-block logo, (b) the GOK palette convention, and (c) Claude/ChatGPT layout patterns the user named as the reference. Treat the UI kit as a **first-pass interpretation** — see the bottom of this file for what we'd want to confirm.

---

## Index

| Path | What's in it |
|---|---|
| `README.md` | This file — context, content + visual foundations, iconography. |
| `SKILL.md` | Agent Skill manifest so this system can be invoked as a skill. |
| `colors_and_type.css` | All design tokens — color scales, semantic vars, type ramp, spacing, radii, shadows, motion. |
| `assets/` | Logos (primary, mark-only, mono variants). Iconography lives here too. |
| `preview/` | Per-card HTML specimens shown in the Design System tab. |
| `ui_kits/pipai-app/` | The chat product — components + interactive `index.html`. |
| `SKILL.md` | Cross-compatible Agent Skill manifest. |

---

## CONTENT FUNDAMENTALS

The product talks to a **사장님 (small-business owner)** who feels nervous about a topic they don't fully understand. Copy has to do two things at once: be **legally precise** (because the consequences are real — fines under PIPA reach hundreds of millions of won) and feel like a **calm, knowledgeable colleague**, not a regulator. The brand voice splits the difference.

### Voice principles
- **Warmly formal.** Default to **합쇼체 / -습니다·-합니다** endings (`확인했습니다`, `도와드릴게요`) — these read as polite-but-conversational in Korean business contexts. **Never use 반말** (informal speech). Avoid bureaucratic 한자어 stacking when a plain word will do.
- **You-focused, not we-focused.** Address the user as **고객님** or **사장님** in onboarding, then drop honorifics inside the chat thread once a relationship is established. Refer to the assistant as **PIPAi** or **저** — never "AI" in user-facing copy unless context demands it.
- **Plain over technical, then footnote.** Lead with what to *do*, then cite the article. `직원 채용 시 주민등록번호는 수집하실 수 없어요. — 개인정보보호법 제24조의2` reads better than `PIPA Article 24-2 prohibits the collection of RRNs except in enumerated cases.`
- **Reassure before you warn.** Even high-risk findings open with what's already fine: `대부분 잘 운영하고 계세요. 다만 한 가지만 같이 점검해볼까요?`
- **No emoji in product copy.** Status is communicated via the red-dot accent, the risk-checklist badges, and color — not 🚨 or ⚠️. (Marketing material may use sparingly; product chrome does not.)
- **Korean numerals & units consistently.** `5명 이상`, `매출 10억원`, `30일 이내`. Use 만/억 in body copy; reserve raw digits for tables and legal citations.

### Casing & punctuation
- Korean body text uses normal sentence flow — no Title Case equivalent.
- Latin words in mixed copy stay lowercase unless brand (`GDPR`, `PIPA`, `PIPAi`).
- Em-dashes and parentheticals are fine; avoid exclamation marks except in success toasts (`저장되었어요!`).
- Article references are written `제○○조` or `제○○조의○`, **never** abbreviated to `§` (unfamiliar to lay Korean readers).

### Example copy snippets
| Surface | Korean | Tone notes |
|---|---|---|
| Empty composer placeholder | `개인정보 처리에 대해 무엇이든 물어보세요.` | Open invitation, no jargon. |
| First reply opener | `네, 사장님. 함께 살펴보겠습니다.` | Warm, partnered. |
| Risk found (high) | `이 부분은 즉시 조치가 필요해 보여요.` | Direct, but `~보여요` keeps it consultative, not accusatory. |
| Risk resolved | `좋아요. 이 항목은 해결됐어요.` | Affirming. |
| Citation lead-in | `관련 조문을 함께 보여드릴게요.` | Service-y, not lecturing. |
| Confirm destructive | `이 대화를 삭제할까요? 되돌릴 수 없어요.` | Clear consequence, soft modal voice. |

---

## VISUAL FOUNDATIONS

### Color
- **GOK Blue (`#003764`)** is the trust anchor. It owns the sidebar, primary buttons, brand mark, links, and headings on light surfaces. Tints (`--blue-50` through `--blue-200`) carry hover and selected states; shades darken pressed states.
- **GOK Red (`#E4032E`)** is **scarce on purpose.** Two jobs: (1) the **logo dot** (the "i" tittle), which is a fixed brand element, and (2) **risk / critical state** in the checklist and inline alerts. Red is *never* used decoratively, *never* on neutral CTAs. When the user sees red, something requires attention.
- **GOK Gray (`#575757`)** is body copy and meta. It is mapped to `--fg-2` / `--gray-600`. Pure black is avoided — `--gray-900` (`#141414`) is the darkest text token to keep contrast warm.
- Tinted backgrounds (`--bg-tint-blue`, `--bg-tint-red`) are used at ~5% saturation for inline callouts (a quoted law article, a flagged risk).

### Type
- **Pretendard** (Korean + Latin) is the workhorse — it covers Hangul beautifully and pairs visually with Latin sans-serifs without the typical mismatch you see when Apple SD Gothic Neo collides with a Western font.
- **Space Grotesk** is reserved for the **wordmark and display moments** — landing hero, big metric numbers, section openers. Its geometric capital forms echo the pixel-block logo. Do not use it for body.
- **JetBrains Mono** for code, IDs, raw legal article numbers in tables, and the rare data-readout. Never for body.
- Type ramp tightens letter-spacing on display sizes (`-0.03em`) and lets body breathe at `1.55` line-height — Hangul needs more vertical room than Latin to stay readable at the same size.

### Spacing & layout
- 4px grid. Page gutters on desktop are `--space-8` (32px); cards inset by `--space-6` (24px); chat bubbles inset by `--space-4` × `--space-5`.
- The chat product uses a **three-column shell**: 260px sidebar (blue) · flexible chat column (max 760px content width) · 320px collapsible right panel (risk checklist). This is fixed — no responsive stacking on tablet+; the right panel collapses to an icon strip below 1024px.
- No full-bleed hero imagery in product. No dashboard density. Generous whitespace is the trust signal.

### Surfaces & elevation
- **Cards** (case cards, law cards, risk items): white surface, `--radius-lg` (14px), `--shadow-sm` at rest, `--shadow-md` on hover. Border `1px var(--border-subtle)` always present — shadow alone isn't enough on the warm-gray canvas.
- **Sidebar** is solid `--gok-blue` with a subtle 1px right border in `--blue-700`. No gradient. No transparency.
- **Modals**: `--shadow-xl` over a `rgba(0, 22, 39, 0.45)` scrim. `--radius-xl` (20px) for emphasis.
- **No glassmorphism.** No backdrop-blur in the product chrome. (Marketing may use a single subtle blur over a brand-blue field, but the app is opaque end-to-end — credibility-first.)

### Borders, radii, corners
- Inputs and small chips: `--radius-md` (10px).
- Cards and panels: `--radius-lg` (14px).
- Pills (status chips, risk badges, tag selectors): `--radius-pill`.
- Buttons inherit input radius at 10px — slightly soft, not aggressive.
- Borders are the *first* line of separation; shadows reinforce, not replace.

### Backgrounds
- App canvas is `--gray-25` (`#FAFAFA`) — a hair off white so cards float without a heavy shadow.
- Marketing surfaces may use a flat `--gok-blue` field or a `--blue-50` tint; **no gradients in the product**, and only a single subtle blue→darker-blue gradient is permitted on the marketing hero (and even that one is optional). No pattern fills, no textures, no noise.
- The pixel-block motif from the logo can be used **once per page** as a quiet decorative element (e.g. an empty-state graphic). It is never tiled.

### Animation & motion
- **Easing**: `cubic-bezier(0.22, 1, 0.36, 1)` (`--ease-out`) is the house easing. It enters quickly and settles — feels confident, not bouncy.
- **Durations**: 120ms for hover/press affordances, 200ms for state transitions, 320ms for panel reveals.
- **No bouncing, no spring overshoot.** Skeptical-of-AI users find spring physics infantilizing. Movement is brief and decisive.
- **Streaming text** in the chat is character-paced (no word-tear), with a subtle blinking caret in `--gok-blue`.
- **Risk checklist** items animate state changes by tinting the row background for 600ms, then fading to neutral. They do not slide.

### Hover & press states
- **Buttons (primary)**: rest `--gok-blue`; hover `--blue-600` (darken); active `--blue-700` + `transform: translateY(1px)` (subtle press, no scale).
- **Buttons (secondary / ghost)**: rest transparent; hover `--bg-hover`; active `--gray-200`.
- **Sidebar items**: hover `rgba(255,255,255,0.08)`; active/selected `rgba(255,255,255,0.14)` + 3px red left-rule (the *only* place the red rule appears in the product, tying back to the logo dot).
- **Cards**: hover lifts with `--shadow-md` and `border-color: var(--border-default)`.
- **Focus rings** are `--shadow-focus` (3px blue glow) on form fields and buttons; destructive elements use `--shadow-focus-red`.

### Transparency & blur
- Used sparingly. The only blurs are: (1) a `backdrop-filter: blur(8px)` on the **modal scrim** to soften the page behind, and (2) a 12px blur on the **mobile composer's bottom-bar** when content scrolls under it. Nowhere else.
- Sidebar overlay states use solid `rgba(255,255,255, 0.08–0.14)` — no blur.

### Imagery
- Product is primarily **non-photographic.** When imagery appears (marketing, onboarding), it skews **cool, clean, daylit** — Korean office settings, no stock-photo handshakes, no AI-generated faces. Light grain is acceptable; saturated filters are not.
- Illustration style (when used): **flat geometric**, sharing the pixel-block logic of the mark. Two-tone (blue + red dot) at most.

### Layout rules
- Sidebar is **fixed**; chat column scrolls; right panel scrolls independently.
- The composer is **sticky to the bottom** of the chat column with a 12px blurred bottom-bar treatment.
- One H1 per page. Section headers in the right panel use the `.t-meta` (uppercase tracked) treatment to differentiate from chat content.

---

## ICONOGRAPHY

### Approach
PIPAi uses **Lucide** as its icon system — a thin (1.5px stroke), rounded, line-only set. The choice rationale:

- **Stroke-only** matches the geometric / non-decorative feel of the pixel-block logo without competing with it.
- **Rounded line caps** soften the otherwise austere navy + red palette — keeps the product approachable for non-lawyers.
- **Predictable optical weight** means icons sit comfortably alongside Korean characters, which run heavier than Latin.
- It's CDN-available so the design system stays portable, and it has a vetted React port if/when the codebase needs it.

We use icons at **20px in nav and chat affordances, 16px in chips and meta rows, 24px in empty-states**. Icon color follows text color (`currentColor`) — never hard-coded to a brand value except for the rare red-dot risk indicator.

> **Substitution flag** — Lucide is a *placeholder choice* until the user supplies their actual icon library or Figma file. If PIPAi ships with custom icons (likely, given the GOK lineage), please share them and we'll swap. Common candidates among Korean public-sector products are KRDS (Korea Government Design System) icons; we did not have access to them in this run.

### Inventory in `assets/`
- `logo-primary.svg` — full wordmark with red **i**-dot. Default on light surfaces.
- `logo-mono-blue.svg` — wordmark, all blue (no red dot). Use when red would clash with adjacent red status (e.g. an alert banner).
- `logo-mono-white.svg` — wordmark, all white with red dot. Use on the sidebar and dark hero fields.
- `logo-mark.svg` — mark only (the pixel-block "P"). Use in favicons, app-icon, sidebar collapsed state.
- `pixel-motif.svg` — decorative variation of the mark for empty states and watermarks.

### Emoji & unicode
- **No emoji** in product chrome or chat copy. The red dot in the wordmark is the only "expressive" mark the brand uses, and overloading it dilutes the signal.
- Unicode arrows (`→`) are used in CTAs and links; bullets (`·`, `•`) are fine in meta rows. Avoid `★`, `✓`, `✗` — use SVG icons instead so they render consistently in Korean fonts.

---

## What's still open / iterate-on

- **No source code or Figma was provided** — UI kit is a synthesized first pass against the brief and the logo. We need either to ground the components.
- **Pretendard** is loaded from CDN; if you want self-hosted woff2s in `fonts/`, share or let us know and we'll inline.
- **Lucide** is a substitution; please share PIPAi's actual icon set when available.
- The right-panel **risk checklist** structure (categories, severity levels, auto-resolution flow) is invented to make the demo concrete. Please share the real schema so we can swap.
- Marketing-site visuals are not built — the brief is product-only. We can extend.
