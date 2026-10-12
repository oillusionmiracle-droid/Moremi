# Story animation and lesson validation update

The first adventure now starts with Blob losing track of orders. The child inspects a deliberately muddled starter rule, chooses its calculation, changes the price, checks a prediction, compares real outputs with expected totals for two, zero and five items, names the counter and saves it. Choosing an answer is separate from verifying it; a wrong answer cannot advance or earn completion. Changing a rule or price invalidates the prediction and prior test evidence.

## Supplied animation mapping

| Original upload | Integrated asset | Moment |
|---|---|---|
| 1000841858.mp4 | blob-problem | Challenge introduction, once with replay |
| 1000841949.mp4 | puff-basket | Map tile, once |
| 1000841968.mp4 | moremi-hint | Moremi guide, once with replay |
| 1000841984.mp4 | blob-idle | Stall idle loop with pause |
| 1000841993.mp4 | blob-success | Only after all orders and prediction pass |
| 1000842020.mp4 | blob-retry | Blob tap reaction |
| 1000842067.mp4 | frog-hop | Bubble Frog tap reaction |
| 1000842068.mp4 | mushroom-hop | Mushroom tap reaction |
| 1000842077.mp4 | album-chest | Future-adventure chest on map |
| 1000842079.mp4 | moremi-welcome | Welcome and saved-creation celebration |

The source uploads remain unchanged. Site assets are H.264 MP4 at 24 fps with muted tracks removed, plus WebP first-frame posters. Character clips are cropped around the full character; footage keeps its original background, framed as matching colored capsules. These are rendered animations, not Rive rigs or alpha cutouts. The combined supplied motion assets including posters are below 1 MB.

## Presentation

User-requested geometric SVG scenery uses lighter/darker tones from each world's existing palette: canopy roofs, rounded tree silhouettes, rings and distant building blocks. Scenery is decorative, noninteractive, and behind task controls. GSAP animates real heading words with scoped cleanup. OS and app reduced motion show posters and skip GSAP.

Phone CSS replaces fixed minimum grid widths with shrinking columns, reduces map offsets, and keeps controls inside their available width. Desktop preview was visually checked. The current browser API does not expose viewport resizing, so a phone-width visual check is still pending; do not describe it as completed.

## Validation

- Regression: at 150 per item, selecting 450 for two items receives explicit incorrect feedback, stays on prediction, and awards nothing. Correcting to 300 unlocks testing.
- A selected addition/subtraction rule executes its actual formula; its incorrect outputs fail against independent expected totals.
- Completion requires changed price, multiplication rule, a checked correct prediction, and all three current-revision tests.
- Old backup records receive additive schema defaults; completed creations and rewards are retained.
- Existing save failure, stale-tab protection, remixes, maker isolation and backup behavior remain covered.
- Offline animation requests support ordinary, suffix and unsatisfiable byte ranges from verified caches.

The remaining nine adventures still say coming later (Market Stall and Weather Helper are playable). This is an introductory guided build about inputs, rules, outputs and testing; it is not yet a complete course in app development.

## Face-first personalization and earned celebration update

The welcome now uses a transparent smiling Moremi head generated from the supplied expression sheet, framed by a sunny circle with a spring entrance, gentle nod and tap-to-replay greeting. The full-body welcome and guide videos no longer appear; the newly supplied 1000842307.mp4 is also full body, so it was not substituted into the face-first welcome. Blob's story clips and the basket/chest map clips remain.

Onboarding has three steps: hello, name/nickname, then optional boy/girl choice. The saved local maker gains backward-compatible identity and profileComplete fields. Existing makers, progress and backup records are retained. The name appears on the map and completion screen. Neither choice changes learning content.

Completion has a dark teal stage, Moremi's smiling head, an earned gold check medal, 56 finite confetti pieces and three truthful stat cards (earned XP, three passing tests, saved apps). Celebrate again repeats only motion and the sound cue. XP and completion still depend on successful validated saving. Reduced motion replaces confetti with static sparkles and disables decorative movement.

WarmAudio produces quiet, low-pass-filtered taps, ascending success notes and a neutral two-note retry. Tap pitch varies ±4%; taps are rate limited to 100ms, and voices fade before replacement. Audio starts only on interaction; mute and hidden-page cleanup stop all voices. This is synthesis, not measured/mastered SFX files; no LUFS claim is made. No audio/video API is required.

## Supplied music and selected expressions

Replaced the broad toothy welcome head with model-extracted top-left calm and center playful heads from the user sheet. Calm is the default welcome/guide face; tapping the welcome switches between the two, and the map/celebration use playful. Imagegen background removal can reinterpret fine details; these are not claimed to be pixel-identical crops. The original sheet and all other expressions remain available for later work.

Sunny Orchard Dash plays across the club/map/apps/album/grown-ups, including onboarding after the first interaction. Rising Wonder plays quietly throughout the build journey. The supplied moremi track plays once on successful saved completion; Celebrate again explicitly restarts it. All tracks are compressed AAC derivatives with normalization and small edge fades; source uploads are unchanged.

Music waits for the first user interaction, fades across scene changes, ducks under short feedback/read-aloud, stops on mute/hidden tab and resumes loop positions. One global Sound and music switch controls music and effects. Async downloads are guarded against playing a stale track after leaving a view. All three local music files are included in the verified offline pack; its budget increases to 8 MB for the newly requested complete tracks.


## Market Stall and greeting update

The greeting badge now follows the portrait in normal document flow rather than overlapping it. Sunny Orchard Dash also plays throughout onboarding after the first gesture, respecting saved mute; Rising Wonder remains the quiet build track and moremi remains the celebration track.

Market Stall is the second playable adventure. Mushroom's starter assigns the wrong jobs to both buttons: selling adds one and restocking adds one even though its button promises two. The child picks a product, explores these buttons, edits their jobs and starting stock, predicts a sale, then tests two customers, an empty shelf and a delivery. The optional walkthrough separates the event, empty-shelf check and value update. The same event interpreter powers play, walkthrough and test evidence, including every intermediate stock value and blocked-sale flag.

Rule edits and undo invalidate prediction and evidence. Completion requires a changed starting stock, take-away-one/bring-two jobs, a checked correct prediction and all three current-revision tests. Saves remain atomic; failures cannot produce celebration or XP. Market Stall and its remixes have separate deduplicated awards, playable saved creations, album ownership and parent reports. Legacy projects default to counter when parsing older backups. Existing counter drafts and creations remain intact. Each maker keeps one saved draft per adventure. Starting another adventure pauses the current draft and opens or resumes the selected adventure, without overwriting earlier edits.

Mushroom's generated fruit-stall story illustration reuses the supplied mushroom reference in the established 3D palette. Preview stock pops, spring headings, soft sounds and optional step tracing supply interaction; this illustration is not a generated video. Its compressed WebP is included in the verified offline pack.


## Cloud Sheep’s Weather Helper

The third playable build introduces if / then decisions. The child chooses a sky palette, explores intentionally muddled gear rules, connects sunshine to a cap, rain to an umbrella and wind to a scarf, checks a rain prediction, and tests a sunny picnic, a rainy picnic and repeated weather changes. An optional explanation exposes the input, matching rule and output. The live preview, tests and saved playable helper share the same interpreter. Every intermediate output in the switching test is verified.

Cloud Sheep is a small vector puppet with softly shaded clay colours, a gentle bounce, blinking eyes and animated drizzle. Meadow layers and drifting cloud shapes add depth without a photographic background. Scene pause controls, global less-movement and OS reduced motion stop decorative loops; text uses the existing GSAP heading treatment. Existing supplied soundtracks and gentle feedback cues apply unchanged. No animation API or external weather service is needed: the child chooses simulated weather.

Rule, theme and undo changes invalidate earlier prediction and test evidence. Completion requires all three correct rules, a checked umbrella prediction, and all current-revision tests. A remix must change the sky palette. Successful atomic saving adds a playable project, a Cloud Sheep sticker, deduplicated 50 core XP or 10 remix XP, and the existing confetti celebration. Counter and stall drafts remain paused and recoverable. Older backups gain additive weather defaults without losing prior work. Parent progress records explain the decision-building skill.

Verification covers weather transitions, wrong predictions and rules, intermediate test evidence, save failures, three-draft switching, reload/resume, saved play, remixes and reward deduplication. Browser visual QA is unavailable in this session because the required managed control-browser skill is not exposed; DOM integration, type checking, production build and offline checks are used.
