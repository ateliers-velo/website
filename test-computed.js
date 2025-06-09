// test-computed.js
const eleventyComputed = require('./src/_data/eleventyComputed.js');

console.log("--- Running test-computed.js ---");

// Call the function exported by eleventyComputed.js
// It expects a 'data' object, so we'll provide a minimal one.
const mockData = {
    page: { inputPath: "src/content/pages/example.en.md", fileSlug: "example.en" },
    site: { languages: ["en", "fr"], defaultLang: "en" },
    collections: { all: [{ inputPath: "src/content/pages/example.en.md" }, { inputPath: "src/content/pages/example.fr.md" }] }
};

const computedProperties = eleventyComputed()(mockData);

console.log("Computed Properties (from test-computed.js):", computedProperties);
console.log("--- test-computed.js finished ---");