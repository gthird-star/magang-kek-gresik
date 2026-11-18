# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

delegated: plain HTML, CSS, and JavaScript for a lightweight static site that can be hosted on GitHub Pages or run locally.

## Users

The primary users are the requester and fellow interns across different staff divisions at KEK Gresik. They need to understand the general scope of each regulation and optionally study provisions related to their division.

## Product Purpose

Provide an approachable learning website for the original government regulations in the project folder. Success means interns can get an overview of all provisions, find the source text, and focus their deeper study on relevant topics.

## Positioning

Learning is organized around both the regulation's complete structure and optional division-specific study paths, with the original PDF kept available as the source of truth.

## Operating Context

The source material consists of PP No. 40 Tahun 2021, PP No. 28 Tahun 2025, and PP No. 71 Tahun 2021 PDF files in the project root. The site should be usable locally and suitable for static hosting.

## Capabilities and Constraints

- Present a broad overview of every provision and optional division-specific learning.
- Keep the original text accessible and distinguish it from learning summaries.
- Avoid requiring a server-side backend unless a future request establishes that need.
- Official regulation names and article text must be grounded in the provided PDFs.

## Evidence on Hand

- `PP_40_2021.pdf`
- `PP_28_2025.pdf`
- `PP_71_2021.pdf`
- `README.md`, which describes the learning context and Waspal focus.

The JSON summaries are partial working notes, not authoritative or complete regulation text.

## Product Principles

- Start with the shared overview before role-specific depth.
- Make the original source easy to verify.
- Keep study progress and navigation simple for interns.
- Clearly distinguish confirmed legal text from explanatory learning aids.
