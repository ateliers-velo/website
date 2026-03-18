#!/usr/bin/env node
/**
 * sync-osm.js
 *
 * Queries OpenStreetMap (Overpass API) for community bike shops in Montreal
 * and syncs factual data into:
 *   - src/content/ateliers/*.md  (frontmatter fields)
 *   - src/_data/ateliers.json    (map coordinates)
 *
 * Fields synced from OSM: osm_id, location, schedule, website, address
 * Fields never touched:   img, logo, redirect, permalink, description,
 *                         public, cost, payment-methods, tags, layout
 *
 * Run: node scripts/sync-osm.js
 */

'use strict';

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const ATELIERS_DIR = path.resolve(__dirname, '../src/content/ateliers');
const GEOJSON_PATH = path.resolve(__dirname, '../src/_data/ateliers.json');
const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

// Bounding box from src/_includes/map.html (south, west, north, east)
const BBOX = '45.38248151412239,-73.97503664228385,45.70820879537386,-73.34553743781728';

// Maximum distance (metres) for proximity-based initial matching
const MATCH_THRESHOLD_M = 200;

// Filename stems that don't match GeoJSON "nom" exactly
const NAME_OVERRIDES = {
  'Le CRABE': 'Le C.R.A.B.E.',
  'Right to Move - La Voie Libre': 'Right to Move / La Voie Libre',
};

// Frontmatter fields that must never be overwritten by OSM data
const PROTECTED_FIELDS = new Set([
  'img', 'logo', 'redirect', 'permalink', 'description',
  'public', 'cost', 'payment-methods', 'tags', 'layout',
]);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Haversine distance in metres between two [lng, lat] points */
function haversineMetres(lng1, lat1, lng2, lat2) {
  const R = 6_371_000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/** Deep-equal check for two [lng, lat] arrays (within floating-point tolerance) */
function coordsEqual(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b)) return false;
  return Math.abs(a[0] - b[0]) < 1e-8 && Math.abs(a[1] - b[1]) < 1e-8;
}

// ---------------------------------------------------------------------------
// Step 1 – Load atelier .md files
// ---------------------------------------------------------------------------

function loadAtelierFiles() {
  const files = fs
    .readdirSync(ATELIERS_DIR)
    .filter((f) => f.endsWith('.md'));

  return files.map((filename) => {
    const filePath = path.join(ATELIERS_DIR, filename);
    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = matter(raw);
    const stem = path.basename(filename, '.md');
    return { filePath, filename, stem, data: parsed.data, content: parsed.content };
  });
}

// ---------------------------------------------------------------------------
// Step 2 – Load GeoJSON for name→coord fallback
// ---------------------------------------------------------------------------

function loadGeoJson() {
  const raw = fs.readFileSync(GEOJSON_PATH, 'utf8');
  const geojson = JSON.parse(raw);

  const lookup = new Map(); // nom → { lng, lat, featureIndex }
  geojson.features.forEach((feature, i) => {
    const nom = feature.properties.nom;
    const [lng, lat] = feature.geometry.coordinates;
    lookup.set(nom, { lng, lat, featureIndex: i });
  });

  return { geojson, lookup };
}

// ---------------------------------------------------------------------------
// Step 3 – Fetch OSM nodes via Overpass
// ---------------------------------------------------------------------------

async function fetchOsmNodes() {
  const query = `[out:json][timeout:30];
(
  node["shop"="bicycle"]["service:bicycle:diy"="yes"]
    (${BBOX});
);
out body;`;

  console.log('Fetching OSM data from Overpass API…');

  let response;
  try {
    response = await fetch(OVERPASS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(query)}`,
    });
  } catch (err) {
    console.error(`Network error querying Overpass API: ${err.message}`);
    process.exit(1);
  }

  if (!response.ok) {
    console.error(`Overpass API returned HTTP ${response.status}: ${response.statusText}`);
    process.exit(1);
  }

  let osmData;
  try {
    osmData = await response.json();
  } catch (err) {
    console.error(`Failed to parse Overpass API response: ${err.message}`);
    process.exit(1);
  }

  const nodes = osmData.elements || [];
  if (nodes.length === 0) {
    console.error(
      'WARNING: Overpass returned 0 nodes — this likely indicates an API or query problem, not that all shops are gone. Aborting without changes.'
    );
    process.exit(1);
  }

  console.log(`Fetched ${nodes.length} OSM node(s).`);
  return nodes;
}

// ---------------------------------------------------------------------------
// Step 4 – Match each atelier file to an OSM node
// ---------------------------------------------------------------------------

function matchAteliers(atelierFiles, osmNodes, geoJsonLookup) {
  const unmatchedOsmNodes = new Set(osmNodes.map((n) => n.id));
  const matches = []; // { file, osmNode }
  const unmatched = []; // file stems with no OSM match

  for (const file of atelierFiles) {
    // ---- Case A: osm_id already stored ----
    if (file.data.osm_id) {
      const node = osmNodes.find((n) => n.id === file.data.osm_id);
      if (node) {
        matches.push({ file, osmNode: node });
        unmatchedOsmNodes.delete(node.id);
        console.log(`  [id]  ${file.stem}  →  OSM ${node.id} (${node.tags?.name || '?'})`);
      } else {
        console.warn(
          `  WARN  ${file.stem}: stored osm_id ${file.data.osm_id} not found in current results (tags may have changed on OSM)`
        );
        unmatched.push(file.stem);
      }
      continue;
    }

    // ---- Case B: proximity matching ----
    // Determine reference coordinates
    let refLng, refLat;

    if (Array.isArray(file.data.location) && file.data.location.length === 2) {
      [refLng, refLat] = file.data.location;
    } else {
      // Fall back to GeoJSON lookup
      const nom = NAME_OVERRIDES[file.stem] ?? file.stem;
      const entry = geoJsonLookup.get(nom);
      if (!entry) {
        console.warn(`  WARN  ${file.stem}: no reference coordinates found (not in GeoJSON), skipping`);
        unmatched.push(file.stem);
        continue;
      }
      refLng = entry.lng;
      refLat = entry.lat;
    }

    // Find closest unmatched OSM node
    let bestNode = null;
    let bestDist = Infinity;
    for (const node of osmNodes) {
      if (!unmatchedOsmNodes.has(node.id)) continue; // already claimed
      const dist = haversineMetres(refLng, refLat, node.lon, node.lat);
      if (dist < bestDist) {
        bestDist = dist;
        bestNode = node;
      }
    }

    if (bestNode && bestDist <= MATCH_THRESHOLD_M) {
      matches.push({ file, osmNode: bestNode });
      unmatchedOsmNodes.delete(bestNode.id);
      console.log(
        `  [prx] ${file.stem}  →  OSM ${bestNode.id} (${bestNode.tags?.name || '?'}) @ ${Math.round(bestDist)}m`
      );
    } else {
      const closest = bestNode
        ? ` (closest was OSM ${bestNode.id} at ${Math.round(bestDist)}m)`
        : '';
      console.warn(`  WARN  ${file.stem}: no OSM node within ${MATCH_THRESHOLD_M}m${closest}`);
      unmatched.push(file.stem);
    }
  }

  // Duplicate-node guard: if two files ended up claiming the same node, flag both
  const nodeToFiles = new Map();
  for (const { file, osmNode } of matches) {
    const list = nodeToFiles.get(osmNode.id) ?? [];
    list.push(file.stem);
    nodeToFiles.set(osmNode.id, list);
  }
  const duplicateNodeIds = new Set(
    [...nodeToFiles.entries()].filter(([, files]) => files.length > 1).map(([id]) => id)
  );
  if (duplicateNodeIds.size > 0) {
    for (const id of duplicateNodeIds) {
      const conflicting = nodeToFiles.get(id).join(', ');
      console.error(`  ERROR Multiple ateliers claim OSM node ${id}: ${conflicting} — skipping both, manual fix required`);
    }
  }

  const safeMatches = matches.filter(({ osmNode }) => !duplicateNodeIds.has(osmNode.id));

  return {
    matches: safeMatches,
    unmatchedAteliers: unmatched,
    unmatchedOsmNodes: osmNodes.filter((n) => unmatchedOsmNodes.has(n.id)),
  };
}

// ---------------------------------------------------------------------------
// Step 5 – Update atelier frontmatter
// ---------------------------------------------------------------------------

function updateAtelierFiles(matches) {
  const updatedFiles = [];

  for (const { file, osmNode } of matches) {
    const tags = osmNode.tags || {};
    const newData = { ...file.data };
    let changed = false;

    // osm_id
    if (newData.osm_id !== osmNode.id) {
      newData.osm_id = osmNode.id;
      changed = true;
    }

    // location [lng, lat]
    const newLocation = [osmNode.lon, osmNode.lat];
    if (!coordsEqual(newData.location, newLocation)) {
      newData.location = newLocation;
      changed = true;
    }

    // schedule (from opening_hours)
    if (tags.opening_hours !== undefined && newData.schedule !== tags.opening_hours) {
      newData.schedule = tags.opening_hours;
      changed = true;
    }

    // website
    const osmWebsite = tags.website || tags['contact:website'];
    if (osmWebsite !== undefined && newData.website !== osmWebsite) {
      newData.website = osmWebsite;
      changed = true;
    }

    // address
    if (tags['addr:housenumber'] && tags['addr:street']) {
      const composed = `${tags['addr:housenumber']} ${tags['addr:street']}`;
      if (newData.address !== composed) {
        newData.address = composed;
        changed = true;
      }
    }

    // Safety: never touch protected fields (this is a guard, not the primary mechanism)
    for (const field of PROTECTED_FIELDS) {
      if (field in file.data && newData[field] !== file.data[field]) {
        console.warn(`  WARN  ${file.stem}: attempted write to protected field '${field}', reverting`);
        newData[field] = file.data[field];
      }
    }

    if (changed) {
      const newFileContent = matter.stringify(file.content, newData);
      fs.writeFileSync(file.filePath, newFileContent, 'utf8');
      updatedFiles.push(file.stem);
    }
  }

  return updatedFiles;
}

// ---------------------------------------------------------------------------
// Step 6 – Update ateliers.json coordinates (preserve single-line formatting)
// ---------------------------------------------------------------------------

function updateGeoJson(geojson, matches) {
  let changed = false;

  for (const { file, osmNode } of matches) {
    // Find the matching GeoJSON feature by name
    const nom = NAME_OVERRIDES[file.stem] ?? file.stem;
    const feature = geojson.features.find((f) => f.properties.nom === nom);

    if (!feature) {
      console.warn(`  WARN  ${file.stem}: not found in ateliers.json by name "${nom}", skipping GeoJSON update`);
      continue;
    }

    const newCoords = [osmNode.lon, osmNode.lat];
    if (!coordsEqual(feature.geometry.coordinates, newCoords)) {
      feature.geometry.coordinates = newCoords;
      changed = true;
    }
  }

  if (changed) {
    // Preserve the original single-line-per-feature formatting
    const header = '{\n  "type": "FeatureCollection",\n  "name": "Ateliers",\n  "features": [\n';
    const footer = '\n  ]\n}';
    const lines = geojson.features.map((f) => '  ' + JSON.stringify(f));
    fs.writeFileSync(GEOJSON_PATH, header + lines.join(',\n') + footer + '\n', 'utf8');
  }

  return changed;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('\n=== OSM Sync ===\n');

  console.log('Loading atelier files…');
  const atelierFiles = loadAtelierFiles();
  console.log(`  ${atelierFiles.length} atelier files found`);

  const { geojson, lookup: geoJsonLookup } = loadGeoJson();

  const osmNodes = await fetchOsmNodes();

  console.log('\nMatching ateliers to OSM nodes…');
  const { matches, unmatchedAteliers, unmatchedOsmNodes } = matchAteliers(
    atelierFiles,
    osmNodes,
    geoJsonLookup
  );

  console.log('\nUpdating frontmatter…');
  const updatedFiles = updateAtelierFiles(matches);

  console.log('Updating ateliers.json…');
  const geoJsonChanged = updateGeoJson(geojson, matches);

  console.log('\n=== Summary ===');
  console.log(`OSM nodes fetched:         ${osmNodes.length}`);
  console.log(`Ateliers matched:          ${matches.length} / ${atelierFiles.length}`);
  console.log(`Frontmatter files updated: ${updatedFiles.length}`);
  if (updatedFiles.length) console.log(`  ${updatedFiles.join(', ')}`);
  console.log(`ateliers.json updated:     ${geoJsonChanged ? 'yes' : 'no'}`);

  if (unmatchedAteliers.length) {
    console.log(`\nAteliers with no OSM match (${unmatchedAteliers.length}):`);
    unmatchedAteliers.forEach((s) => console.log(`  - ${s}`));
    console.log('  → Add osm_id: <node_id> to their frontmatter to link them manually.');
  }

  if (unmatchedOsmNodes.length) {
    console.log(`\nOSM nodes not matched to any atelier (${unmatchedOsmNodes.length}):`);
    unmatchedOsmNodes.forEach((n) =>
      console.log(`  - OSM ${n.id}: ${n.tags?.name || '(no name)'} [${n.lat}, ${n.lon}]`)
    );
    console.log('  → These may be new shops not yet on the site.');
  }

  console.log('');
  process.exit(0);
}

main().catch((err) => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
