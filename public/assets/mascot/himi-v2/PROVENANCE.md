# Himi v2 mascot set

Generated with the built-in OpenAI image generation tool on 2026-09-02, using
`public/assets/brand/himi-mascot-master.png` only as the character identity and
palette reference.

All six variants share these constraints:

- exactly two attached penguin flippers and two feet;
- black-and-white body, orange beak and feet, vivid red scarf;
- transparent background;
- no board, sign, tablet, text, logo, watermark, human hands, fingers, thumbs,
  extra limbs, or duplicate body parts.

Variants:

- `himi-wave`: one flipper waving, one resting at the side;
- `himi-listen`: mint headphones, one flipper at the ear cup, one raised;
- `himi-cheer`: both flippers raised, one foot lifted;
- `himi-celebrate`: both flippers wide during a small victory hop.
- `himi-writing`: one flipper holds a calligraphy brush, one rests on the belly;
- `himi-video`: both flippers hold one small clapperboard and no other limb is raised.

The source PNG files are preserved in `source/`. Run
`node scripts/build-himi-v2-assets.mjs` to recreate optimized WebP fallbacks and
transparent animated GIFs. Each GIF uses 60 evenly timed frames at 50 FPS so the
loop stays fluid, while a 512 px animation canvas keeps decoding responsive.
