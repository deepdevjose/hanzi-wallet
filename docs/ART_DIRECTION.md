# Hanzi Wallet — character and welcome artwork

## Active character direction

The character system is an original **2D Chinese cartoon illustration** implemented in `src/avatar.ts` and `src/avatar.css`. Both full-body bases use flat colours, soft ink outlines, expressive brows, warm cheek accents and simple rounded silhouettes. The direction draws on traditional Chinese illustration and paper-cut motifs while retaining the app's ivory, slate, jade and muted seal-red palette.

Character bodies, expressions, clothes, shoes and headwear share one articulated SVG coordinate system. Sleeves and hands belong to the same arm groups; hats follow the head, and footwear follows the feet. Garments change their shape within this common rig instead of being positioned over an independently rendered body. Character and shop illustrations use this same 2D system, including traditional robes, the dragon companion and dragon-frame ornaments. A raster image is not used as a character body or a wardrobe layer.

The two bases are independent from the learner's optional gender field. Both begin in a plain short-sleeved T-shirt, dark trousers and simple shoes. The T-shirt has eight free colours, defined with their translated names in `SHIRT_COLORS` in `src/core/profile.ts`:

| Colour         | Hex       |
| -------------- | --------- |
| Ivory          | `#eee5d3` |
| Jade (default) | `#7d9690` |
| Slate          | `#75818c` |
| Seal red       | `#b47668` |
| Porcelain blue | `#8296ab` |
| Ochre          | `#c3a16b` |
| Plum pink      | `#bb8e96` |
| Ink            | `#4a5156` |

The selected colour is stored with the profile, independently of the equipped outfit, so returning to the starter T-shirt restores the learner's choice. Existing ownership, balances, placement and progress stay in the original profile storage key.

## Character motion

Main character previews have a calm idle motion and blinking eyes, with a friendly wave on interaction. The body and its equipped pieces move together. Shop thumbnails keep their product details easy to inspect and use restrained motion on interaction. `prefers-reduced-motion` provides a still, fully usable version; essential actions and state must remain accessible without animation.

The SVG source is the canonical character artwork. Adjust its shared proportions and attachment points when extending the wardrobe; do not add separate body renders or manually offset clothing bitmaps.

## Welcome artwork

The welcome uses two retained illustrations created with the built-in ImageGen tool for this project on 13 November 2026. They are original generated illustrations, not extracted reference stickers. No external image API or paid CLI fallback was used. Profile backgrounds are drawn in the same native 2D system as the characters. The detailed dragon belongs to the welcome transition; the shop's dragon companion is drawn in the character system's 2D style.

| File                            | Use                                            | Format                    |
| ------------------------------- | ---------------------------------------------- | ------------------------- |
| `public/art/ink-landscape.webp` | Ink-painting welcome background | 1586 × 992, WebP          |
| `public/art/dragon.png`         | Welcome dragon transition                      | Wide transparent RGBA PNG |

The landscape was converted from the generated PNG to WebP at quality 88 without changing the illustration. Preserve the dragon's transparent alpha when reusing it.

## Retained ImageGen prompts

### Landscape

Use case: stylized-concept. Asset type: widescreen background painting for a premium Mandarin learning app's first welcome screen. A quiet exquisite traditional Chinese shan shui ink wash landscape painted on ivory rice paper, pale slate gray misty layered mountains fading into clouds, delicate weathered pine and small classical pavilion on a rocky promontory in lower right, sparse elegant plum blossom branch with restrained muted cinnabar-red flowers entering from upper left. Large luminous empty center 65% suitable for dark calligraphy overlay. Broad painterly atmospheric washes, authentic brush texture, beautiful calm museum-quality subtle composition; Apple-like elegant restraint. Palette warm off-white ivory #f2f1ef, slate ink #4c5360, light taupe-gray, very restrained muted seal-red #99645c. Landscape 16:10, no text, no symbols, no logos, no lettering, no watermarks, no people. No strong orange or sepia wash; soft neutral paper.

### Welcome dragon

Use case: stylized-concept. Asset type: transparent Chinese dragon illustration sprite for a quiet app loading animation and a magical welcome transition. Single beautiful long serpentine Chinese long dragon, elegant jade-slate dark gray scales, restrained pale antique gold horns and whiskers, soft small cinnabar-red mane accents, realistic detailed scales yet friendly wise expression, premium semi-realistic 3D painted illustration. Entire sinuous dragon visible in an elongated horizontal sideways S curve making two loose coils, head toward right, body like a flowing ribbon around an invisible horizontal progress bar. Four small traditional clawed legs, delicate whiskers, gentle attentive golden eye, no wings (Chinese dragon), no fire or smoke painted in. Clean transparent cutout background, no shadow, no halo or glow, no ground, no landscape. Single coherent animal anatomy, exquisite balanced silhouette, fills wide landscape canvas with padding. Muted ivory/slate/jade palette compatible with minimal elegant interface, no bright saturated red, no text logo watermark. Must be clearly a traditional Chinese dragon, not Western dragon, no snake without limbs.

## Integration notes

- Keep state, names, loading messages and progress in accessible HTML; illustration must not be the only way to understand an action.
- Use the same SVG parts for full-body previews, portraits and shop artwork. Crop the view to the relevant item rather than altering the character's geometry.
- Honour reduced motion and the selected light/dark appearance without changing the flat character palette into simulated 3D lighting.
- New character cosmetics should use the shared rig and existing item IDs. Retained welcome artwork is a separate decorative resource.
- Verification results belong in `docs/IMPLEMENTATION_STATUS.md`; this document records the active visual direction and resource provenance.
