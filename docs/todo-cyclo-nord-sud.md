# TODO — Cyclo Nord-Sud (spring 2027)

Cyclo Nord-Sud (CDN and NDG shops) were added to the map and ateliers page on
2026-09-24, then removed on 2026-09-25: they don't currently qualify as BUM ateliers.

Revisit in spring 2027:

- [ ] Confirm whether they now qualify / want to join the network
- [ ] If yes, re-add them (see below)
- [ ] Either way, consider a blog post announcing them (FR + EN, same subfolder under
      `src/content/posts/<slug>/`, see CLAUDE.md "Bilingual post workflow")

## Re-adding

The logo is kept on disk: `src/imgs/atelier-logos/BB_CYCLO_NS.jpg`.

Both shops share one URL (`https://urls.fr/vdWf1U`) and one logo. Original entries,
from commit `cb58b83` (logo swapped in `fe06a7c`), for `src/_data/ateliers.json`:

```json
{ "type": "Feature", "properties": { "nom": "Cyclo Nord-Sud CDN", "logo_path": "/imgs/atelier-logos/BB_CYCLO_NS.jpg", "url": "https://urls.fr/vdWf1U" }, "geometry": { "type": "Point", "coordinates": [ -73.6317042238174, 45.50543452027958 ] } },
{ "type": "Feature", "properties": { "nom": "Cyclo Nord-Sud NDG", "logo_path": "/imgs/atelier-logos/BB_CYCLO_NS.jpg", "url": "https://urls.fr/vdWf1U" }, "geometry": { "type": "Point", "coordinates": [ -73.6384655636408, 45.471877380571364 ] } }
```

Plus two redirect stubs in `src/content/ateliers/` (`Cyclo Nord-Sud CDN.md`, `Cyclo Nord-Sud NDG.md`):

```yaml
---
permalink: false
redirect: https://urls.fr/vdWf1U
---
```

Easiest: `git show cb58b83 -- src/_data/ateliers.json src/content/ateliers`.
