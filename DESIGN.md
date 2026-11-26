---
name: Buku Belajar KEK Gresik
description: A clear, locally saved study guide for reading KEK regulations.
colors:
  ink: "#17343b"
  ink-soft: "#526b71"
  teal: "#104f5a"
  teal-deep: "#0c505a"
  teal-soft: "#dff1f2"
  teal-line: "#85b7bd"
  paper: "#ffffff"
  ground: "#f3f6f7"
  accent: "#126572"
  accent-warm: "#f4a17f"
  line: "#b9cdd4"
  success: "#245c3b"
  warning: "#8a4218"
  focus: "#bf4b22"
typography:
  display:
    fontFamily: "Public Sans"
    fontSize: "clamp(34px, 4vw, 54px)"
    fontWeight: 700
    lineHeight: 1.07
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "Public Sans"
    fontSize: "clamp(28px, 3.2vw, 38px)"
    fontWeight: 700
    lineHeight: 1.08
  body:
    fontFamily: "Public Sans"
    fontSize: "16px"
    lineHeight: 1.55
  legal-text:
    fontFamily: "Public Sans"
    fontSize: "16px"
    lineHeight: 1.78
rounded:
  control: "6px"
  card: "10px"
  reader: "12px"
spacing:
  control-gap: "14px"
  field-padding: "9px 11px"
---

# Design System: Buku Belajar KEK Gresik

## Direction

The interface is a practical reading desk for a numbered learning guide. A deep teal navigation rail anchors four focused views; the regulation reader remains a quiet, high-contrast document surface. Warm coral is a small progress accent, not a second primary color.

The provided UI references guide the information architecture and overall composition. Their unsupported regulation names, sample counts, profile, streaks, and promotional text are not copied. The supplied learning illustration is shown on a white panel because its PNG has a white background.

## Product rules

- Preserve regulation names, complete article text, explanations, and PDF page references from the source data.
- Keep original PDFs readily accessible and label learning aids separately from official text.
- All progress and custom paths remain local to the current browser.
- Show progress from stored completion/check state only. Do not invent streaks, scores, identities, or user accounts.
- The Waspal path remains explicitly marked as a draft.

## Colors

- **Deep teal** `#104f5a`: hero and selected navigation.
- **Teal ink** `#17343b`: headings and primary text.
- **Teal action** `#126572`: links, controls, and progress.
- **Pale teal** `#dff1f2`: grouped learning controls and article header.
- **Warm coral** `#f4a17f`: restrained progress emphasis.
- **Paper** `#ffffff`; **ground** `#f3f6f7`; **soft ink** `#526b71`.
- **Focus** `#bf4b22`: visible keyboard focus.

## Typography

Public Sans is self-hosted from `assets/fonts/public-sans-latin.woff2`. Use it for all interface and legal text. Body copy starts at 16px; legal text keeps a readable measure near 70ch and line-height 1.78. Headings use a clear scale with tight but restrained tracking.

## Layout

- Desktop: a 256px white left navigation rail with a flexible content column capped at 1440px.
- Mobile: a fixed four-item bottom navigation with safe-area padding; content receives enough bottom space to remain unobscured.
- The learning view pairs a dark teal introduction with the supplied illustration on white, followed by selectable paths.
- Progress is a dedicated view with computed completion, self-check, saved-path counts, last selected article, and completed articles.
- Regulation reading pairs the searchable article index with the full reader; the index becomes a stacked, collapsible panel on mobile.
- Sources have their own view with direct PDF links and the existing extraction/legal-use notice.

## Components and states

- Navigation targets are at least 44px tall and keep a visible keyboard focus ring.
- Buttons and fields use clear borders, square-to-soft corners, and explicit hover/disabled states.
- Article source links and page references stay adjacent to official text.
- Empty states explain the next useful action. Storage errors remain visible through the live status message.
- Motion is limited to a short view transition and respects `prefers-reduced-motion`.
- Icons use consistent inline SVG strokes; emoji are not used as controls.

## Avoid

- Hiding source material, shortening official text, or presenting partial JSON notes as complete law.
- Invented progress analytics, profile cards, streaks, or official-looking learning paths.
- Generic dashboard metrics, decorative gradients, excessive shadows, or low-contrast text.
