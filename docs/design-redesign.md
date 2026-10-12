# Moremi visual redesign — October 2026

## Evidence and decisions

The four user-supplied vertical references show Finch-style colourful pet worlds, character dialogue, friend selection, gifts and celebrations. They are motion/composition references and are not embedded as app content. The Moremi character remains the yellow-shirt, patched-overalls maker.

Public gameplay imagery inspected by scrolling Sago Mini World and Pok Pok’s press kit:
- https://sagomini.com/world/ — self-contained, vividly coloured play rooms, large toys and short visual instructions.
- https://playpokpok.com/press/press-kit/ — toy composition, clear touch affordances, colour-coded primary controls.
- https://developer.apple.com/news/?id=5bcex7xf — first-party account of Pok Pok’s tactile interactions and bespoke short sounds.
- https://www.tocaboca.com/toca-boca-world — character-led world exploration.

Downloaded reference skill: Anthropic frontend-design, source blob a5333457c414d20d625f307df945842c0952ecc3. The original SKILL.md and Apache-2.0 LICENSE.txt are vendored under docs/references/frontend-design. Source: https://github.com/anthropics/skills/tree/main/skills/frontend-design. Applied principles: distinct product scene, intentional colour, meaningful motion, clear hierarchy, touch targets and restrained copy. User instructions for bright worlds and active character play override conservative generic motion defaults.

## Scene and motion plan implemented

| Surface | Canvas | Feedback |
| --- | --- | --- |
| Splash / welcome | Sky blue, yellow circle | Transparent Moremi head, spring greeting, name and optional identity setup |
| My path | Mint green clay market | Bouncing current node, coloured navigation, saved draft |
| Challenge / workbench | Warm yellow | Moremi reaction, bouncy totals, physical controls |
| Choose a direction | Light blue | Three coloured selected cards lift |
| Prediction | Lilac | Selected answer lifts, preserved explanation |
| Tests | Mint | Passed result pops; correct totals stay visible |
| Handoff / album | Pink | Sticker lands; actual saved app can be opened |
| My Apps | Lilac | Saved projects play and remix |
| Reward | Dark teal, gold medal | Moremi head, finite confetti burst, truthful XP/tests/apps cards, replay |
| Grown-ups | Peach | Tinted paper, controls, backups, local makers |

Sound uses locally synthesized warm filtered taps, C5/E5/G5 success notes and a gentle low double-note retry, with ±4% tap pitch variation and a 100ms tap interval. It begins synchronously in the CTA event before saving/navigation; no network/API is required. Mute is explicit and persistent. Motion obeys OS and in-app preferences; no animation is needed to understand or complete a step.

## Asset review

The former grey-backed creatures were confirmed RGB, then edited with image generation into real alpha images. Integrated 480px cutouts have transparent canvas corners. The frog’s glassy source aesthetic is retained. The Moremi sheet extraction generated edge fragments, so it was not shipped. Reaction crops reuse the consistent existing transparent atlas. This is pose-based motion, not a fully rigged facial/body animation.

## Scope

This update upgrades presentation and interaction across the existing first adventure. It does not pretend that the eleven coming-later projects are playable or that Google sign-in is connected.
