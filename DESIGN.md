---
name: Buku Belajar KEK Gresik
description: A calm, numbered field guide for learning the KEK regulations.
colors:
  ink: "#18303a"
  ink-soft: "#3d5964"
  sky-paper: "#dff3fa"
  sky-deep: "#b7dfec"
  sky-line: "#88b8c8"
  paper: "#ffffff"
  ground: "#f3f8fa"
  source-blue: "#145c78"
  source-blue-deep: "#10465c"
  warning: "#8a4218"
  warning-line: "#d5a77e"
  warning-paper: "#fff8f1"
  sky-soft: "#eaf6fa"
  line-soft: "#d4e5eb"
  success: "#245c3b"
  disabled-line: "#9fb3bb"
  disabled-paper: "#e9eff1"
  disabled-ink: "#54676f"
  line: "#b9cdd4"
  line-dark: "#76949e"
  focus: "#bf4b22"
typography:
  display:
    fontFamily: "Public Sans"
    fontSize: "clamp(32px, 3.8vw, 52px)"
    fontWeight: 700
    lineHeight: 1.08
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Public Sans"
    fontSize: "clamp(28px, 3.2vw, 38px)"
    fontWeight: 700
    lineHeight: 1.08
  builder-title:
    fontFamily: "Public Sans"
    fontSize: "25px"
    fontWeight: 700
  empty-title:
    fontFamily: "Public Sans"
    fontSize: "28px"
    fontWeight: 700
  section-title:
    fontFamily: "Public Sans"
    fontSize: "15px"
    fontWeight: 700
  lead:
    fontFamily: "Public Sans"
    fontSize: "17px"
    lineHeight: 1.55
  body:
    fontFamily: "Public Sans"
    fontSize: "16px"
    lineHeight: 1.55
  control:
    fontFamily: "Public Sans"
    fontSize: "14px"
  compact:
    fontFamily: "Public Sans"
    fontSize: "13px"
  meta:
    fontFamily: "Public Sans"
    fontSize: "12px"
  label:
    fontFamily: "Public Sans"
    fontSize: "11px"
    fontWeight: 700
    letterSpacing: "0.1em"
rounded:
  square: "0"
spacing:
  control-gap: "14px"
  field-padding: "9px 11px"
components:
  button-primary:
    backgroundColor: "{colors.source-blue}"
    textColor: "{colors.paper}"
    rounded: "{rounded.square}"
    padding: "10px 15px"
    height: "43px"
  button-outline:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.square}"
    padding: "10px 15px"
    height: "43px"
---

# Design System: Buku Belajar KEK Gresik

## Overview

**Creative North Star: "Panduan Langkah"**

The interface treats the regulations as a numbered study sequence, not as a generic dashboard. Sky-blue surfaces and dark ink recall an instruction booklet, while the legal text stays in a quiet, readable column with clear links back to each original PDF page.

The visual system is flat and deliberately restrained. Sequence markers help readers navigate, but they never replace official article numbers or wording. Learning aids and locally saved progress remain distinct from the source text.

**Key Characteristics:**
- Numbered, navigable study steps.
- Exact source wording with visible PDF references.
- Local-first, low-distraction reading.

## Colors

Soft sky blues establish the booklet surfaces; dark ink carries reading and navigation, with a deeper blue reserved for actions and source links.

### Primary
- **Source Blue** (#145c78): Primary actions and progress.
- **Deep Source Blue** (#10465c): Hover state and strong links.

### Secondary
- **Sky Paper** (#dff3fa): Masthead, lesson heading, and control surface.
- **Deep Sky** (#b7dfec): Secondary blue surface and selection tint.

### Neutral
- **Ink** (#18303a): Headings and primary text.
- **Soft Ink** (#3d5964): Supporting text on light surfaces.
- **Paper** (#ffffff): Reading surface and outlined controls.
- **Ground** (#f3f8fa): Page background.
- **Pale Line** (#b9cdd4) and **Dark Line** (#76949e): Separators and control borders.
- **Focus Orange** (#bf4b22): Visible keyboard focus.
- **Warning Brown** (#8a4218): Storage and recovery messages.

## Typography

**Display Font:** Public Sans, self-hosted from `assets/fonts/public-sans-latin.woff2`  
**Body Font:** Public Sans  
**Label Font:** Public Sans; monospace is reserved for step numerals.

**Character:** Public Sans gives the guide a clear, contemporary public-information voice. Compact uppercase labels and tabular step numbers organize the interface without competing with long legal passages.

### Hierarchy
- **Display** (700, `clamp(32px, 3.8vw, 52px)`, 1.08): Page title.
- **Headline** (700, `clamp(28px, 3.2vw, 38px)`, 1.08): Current article.
- **Title** (700, 15–25px): Section and builder headings.
- **Body** (400, 16px, 1.55): Interface copy; official text uses 1.78 line-height and a 70ch measure.
- **Label** (700, 10–12px, tracked): Navigation metadata, source labels, and progress.

## Layout

The desktop page uses a wide container capped at 1440px, with a compact regulation index beside an 860px lesson column. The index remains sticky on wide screens. On small screens the layout stacks, the index starts collapsed, and filters reduce to a two-column arrangement where space allows. Controls retain a 43px minimum height for touch.

The article body is kept to a 70ch measure. Tight control groups use 10–14px gaps; larger reading sections receive more separation.

## Elevation & Depth

There are no shadows. Depth comes from the contrast between the sky-blue masthead, pale page ground, white reading surface, and thin borders. Keep the surface hierarchy flat rather than adding floating cards or decorative elevation.

## Shapes

The guide uses square corners (`border-radius: 0`) and thin, purposeful outlines. Number chips, source callouts, and controls use the same crisp geometry; avoid rounded cards and pill-shaped containers.

## Components

### Buttons
- **Shape:** Square corners, 1px ink border.
- **Primary:** Source Blue with white text; 43px minimum height and 10px 15px padding.
- **Hover / Focus:** Darken the primary action on hover; use the shared high-contrast focus outline for keyboard navigation.
- **Secondary:** White surface with dark ink; hover shifts to a pale blue.

### Chips
- **Style:** White surface, 1px dark-ink outline, tabular step count.
- **State:** The active article is distinguished in the index without changing its official number.

### Cards / Containers
- **Background:** White for the lesson body; sky blue for the lesson heading and control strip.
- **Shadow Strategy:** None; separate surfaces with borders.
- **Border:** 1px blue or neutral line, depending on context.

### Inputs / Fields
- **Style:** White surface, square corners, 1px dark-line border, 43px minimum height.
- **Focus:** 3px orange outline with visible offset.
- **Error / Disabled:** Storage errors use the warning palette; disabled lesson navigation uses a muted neutral surface.

### Navigation
- **Style:** Underlined, bold links in dark ink.
- **Desktop:** Sticky regulation index beside the reader.
- **Mobile:** Collapsible index above the reader; selecting an article closes it.

### Source Callout
- Keep the official PDF link and page reference together immediately above the provision text. The PDF remains the authoritative source.

## Do's and Don'ts

### Do:
- **Do** preserve the official article number, wording, regulation title, and PDF page reference.
- **Do** make study paths and recall prompts visibly separate from official text.
- **Do** keep progress and custom paths local to the current browser.

### Don't:
- **Don't** invent legal summaries or imply that the Waspal draft path is an official syllabus.
- **Don't** hide the source PDF behind a secondary navigation step.
- **Don't** add decorative shadows, rounded-card scaffolds, or colors outside the established palette.
