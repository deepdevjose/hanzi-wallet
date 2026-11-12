# Hanzi Wallet — character and welcome artwork

The production assets in `public/art/` were created with the built-in ImageGen tool for this project on 13 November 2026. They are original generated illustrations, not extracted versions of the reference stickers. No external image API or paid CLI fallback was used. The reference images informed the friendly Chinese character direction and the quiet ink landscape.

## Selected assets

| File | Use | Format |
| --- | --- | --- |
| `avatar-male.png` | Full-body male character base | 1024 × 1536, RGBA PNG |
| `avatar-female.png` | Full-body female character base | 1024 × 1536, RGBA PNG |
| `avatar-male-hanfu.png` | Male lunar hanfu wardrobe variant | 1024 × 1536, RGBA PNG |
| `avatar-female-hanfu.png` | Female lunar hanfu wardrobe variant | 1024 × 1536, RGBA PNG |
| `avatar-male-imperial.png` | Male imperial wardrobe variant | 1024 × 1536, RGBA PNG |
| `avatar-female-imperial.png` | Female imperial wardrobe variant | 1024 × 1536, RGBA PNG |
| `ink-landscape.webp` | First-visit welcome background | 1586 × 992, WebP |
| `dragon.png` | Loading and welcome transition | Wide RGBA PNG |

The character bodies are independent from a learner's optional gender field. Both bases are clothed, front-facing and use matching ivory tops, slate trousers and neutral shoes. A trial male image that looked too photographic was discarded before integration. The selected images have genuine transparent alpha; do not flatten them over black. The landscape was converted from the generated PNG to WebP at quality 88 without changing the illustration. Original outputs remain in the generator's output directory.

## Prompt set

### Character bases

Use case: stylized-concept. Asset type: premium app character sprite. One charming young adult Chinese man / woman in a beautiful professional 3D cartoon style: visibly stylized round head, large expressive almond eyes, simplified soft facial features, short cute proportions about 4.5 heads tall, inspired by premium animated feature character design with tactile matte ceramic painted finish. Male: dark black short neat slightly tousled hair. Female: dark black straight hair in neat low bun with soft side fringe. Friendly confident little smile. Entire full body front-facing, relaxed symmetrical pose arms slightly away from body, hands open relaxed, both feet fully visible. Ivory plain mandarin-collar long-sleeve top, slate-gray simple straight trousers, ivory canvas shoes, no props or accessories. Muted warm ivory, charcoal slate palette. GENUINE FULLY TRANSPARENT EMPTY BACKGROUND: no gradient backdrop, no gray halo, no glow, no ground plane, no background shadow. Clean hard cutout alpha around character only. Portrait 2:3 canvas, figure centered and fills height from 7% to94%, head center around18% high, shoulder near32%, waist near59%, feet94%. No text logos watermark. Consistent usable base sprite for dress-up game; fully clothed tasteful friendly; cartoon not photographic and not a realistic person.

### Landscape

Use case: stylized-concept. Asset type: widescreen background painting for a premium Mandarin learning app's first welcome screen. A quiet exquisite traditional Chinese shan shui ink wash landscape painted on ivory rice paper, pale slate gray misty layered mountains fading into clouds, delicate weathered pine and small classical pavilion on a rocky promontory in lower right, sparse elegant plum blossom branch with restrained muted cinnabar-red flowers entering from upper left. Large luminous empty center 65% suitable for dark calligraphy overlay. Broad painterly atmospheric washes, authentic brush texture, beautiful calm museum-quality subtle composition; Apple-like elegant restraint. Palette warm off-white ivory #f2f1ef, slate ink #4c5360, light taupe-gray, very restrained muted seal-red #99645c. Landscape 16:10, no text, no symbols, no logos, no lettering, no watermarks, no people. No strong orange or sepia wash; soft neutral paper.

### Premium hanfu variants

Use case: identity-preserve. Asset type: transparent full-body outfit variant for an existing dress-up game avatar. Input: the corresponding original male or female PNG above, inspected before editing. Edit the provided cartoon character, changing ONLY CLOTHING from the neck downward to beautiful traditional Chinese hanfu: flowing luminous lunar ivory robe with muted jade-green cross-collar trim and long sash belt, delicate pale gold cloud and bamboo embroidery, elegant layered skirt-like robe, tasteful soft silk folds. Keep this EXACT same person's face, eyes, hair, ears, skin color, expression, head size, head position, body proportions, hand positions, pose, frontal view, lighting and beautiful semi-realistic 3D cartoon rendering style. Keep both original neutral shoes visible beneath the robe and keep original 1024x1536 portrait canvas and scale, figure fits fully with no crop, head top near 2%, feet near98%. Hands relaxed slightly away from body; long flowing sleeves must remain coherent with the original hand pose. No crown, no hat, no jewelry, no props, no text, no watermark. Preserve genuinely transparent background; clean alpha cutout, no background or halo. This should feel like the same avatar wearing a premium serene traditional Chinese hanfu, not a different person.

### Premium imperial variants

Use case: identity-preserve. Asset type: highest-tier transparent full-body outfit variant for an existing dress-up game avatar. Input: the corresponding original male or female PNG above, inspected before editing. Edit the provided cartoon character, changing ONLY CLOTHING from the neck downward to luxurious classical Chinese imperial ceremonial attire: dignified muted cinnabar-red silk long robe, layered charcoal-jade lapels, fine antique gold Chinese long dragon embroidery across chest and hem (female variant also has phoenix embroidery), intricate restrained cloud and wave motifs, refined broad belt with small jade clasp, elegant layered long robe skirt and tailored flowing sleeves. Ultra-premium fine silk texture and exquisite sophisticated finish, rewards for an advanced Mandarin learner. Keep this EXACT same person's face, eyes, hair, ears, skin color, expression, head size, head position, body proportions, hand positions, pose, frontal view, lighting and beautiful semi-realistic 3D cartoon rendering style. Keep both original neutral shoes visible beneath robe and keep original 1024x1536 portrait canvas and scale, figure fully fits no crop, head top near2%, feet98%. Hands relaxed slightly away from body; sleeves coherent with original hand pose. No crown, no hat, no weapons, no props, no jewelry, no text, no watermark. Preserve genuinely transparent background, clean alpha cutout, no background halo. Same avatar in a magnificent authentic Chinese formal robe, not a different person, avoid Western royal costume.

### Dragon

Use case: stylized-concept. Asset type: transparent Chinese dragon illustration sprite for a quiet app loading animation and a magical welcome transition. Single beautiful long serpentine Chinese long dragon, elegant jade-slate dark gray scales, restrained pale antique gold horns and whiskers, soft small cinnabar-red mane accents, realistic detailed scales yet friendly wise expression, premium semi-realistic 3D painted illustration. Entire sinuous dragon visible in an elongated horizontal sideways S curve making two loose coils, head toward right, body like a flowing ribbon around an invisible horizontal progress bar. Four small traditional clawed legs, delicate whiskers, gentle attentive golden eye, no wings (Chinese dragon), no fire or smoke painted in. Clean transparent cutout background, no shadow, no halo or glow, no ground, no landscape. Single coherent animal anatomy, exquisite balanced silhouette, fills wide landscape canvas with padding. Muted ivory/slate/jade palette compatible with minimal elegant interface, no bright saturated red, no text logo watermark. Must be clearly a traditional Chinese dragon, not Western dragon, no snake without limbs.

## Integration notes

- Animate these resources through CSS transforms, opacity and masks so their source artwork stays reusable.
- Honor `prefers-reduced-motion`; decoration must not delay access to learning.
- Keep wardrobe overlays, profile frames and background choices in the app's existing code-native rendering system. The raster bases are the stable character foundation.
- The illustrations are decorative; state, loading messages, names and progress need accessible HTML equivalents.
