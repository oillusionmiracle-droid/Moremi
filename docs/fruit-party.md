# Fruit Party — playable stock app

The child places a stock display, chooses starting fruit, connects Sell and Refill jobs, predicts one sale, then operates the app through two customers, an empty shelf and a delivery. The saved creation uses the same `stallEvent` interpreter and StockPad as the lesson. Incorrect jobs never earn test evidence. Rewards require a successful save.

New fruit apps begin without a display. The additive `stockDisplayPlaced` field defaults to true when opening old records, preserving older drafts and completed creations. Existing stock test evidence and awards remain intact. Each short customer challenge restarts at its beginning after reloading; already completed challenges stay earned.

The UI uses separate live fruit, controls and character cutouts. Environment art contains no UI or baked lettering. Music and reduced-motion preferences remain shared with the rest of Moremi.

## Environment asset

- File: `public/art/world/fruit-shop.webp`
- Source: built-in image generation; production image converted to WebP.
- Character: existing transparent `public/art/mushroom-cutout.webp`, retained unchanged.

Final generation prompt:

> Use case: stylized-concept. Asset type: portrait 9:16 environment plate for Moremi children's browser game, Mushroom's fruit shop. Generate one new original background matching the already-visible Moremi snack-shop environment in material, light and world. View from inside a whimsical fruit-shop stall toward a bright orchard village: lime-green and warm-yellow scalloped awning at top, rounded apricot wooden posts at left and right, soft teal sky, a gently winding path through fruit trees, pink flowers, cobalt and tangerine tiny roofs in the distance. Front lower half: large clear warm honey-coloured wooden counter with simple broad planks, ample uncluttered space reserved for live game controls. Small decorative empty purple crates at extreme side edges only. All interactive fruit and the mushroom character will be added separately; DO NOT render any fruit piles, characters, UI, screens, buttons, numbers or lettering. Modern stylized 3D illustration, smooth matte vinyl toy aesthetic, velvety clay shader, clean soft ambient occlusion, soft diffuse studio lighting, zero texture noise, crisp graphic silhouettes. Vibrant high-saturation colour blocking: lime, warm yellow, cobalt, teal, bubblegum pink. Fully coloured edge to edge, no white background, no white frame, no text or watermark.

## Verification

TypeScript, domain/DOM interaction tests, build and offline integrity checks. DOM tests cover wrong predictions, wrong Sell jobs, checkpoint reload, empty-stock sale blocking and the saved app's Sell/Refill actions. Existing domain tests cover bad refill rules, migration and deduplicated rewards. Browser/touch-device visual QA was unavailable in this session and is still needed.
