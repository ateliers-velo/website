// Import prior to `module.exports` within `.eleventy.js`
const { DateTime } = require("luxon");
/*
const markdownIt = require('markdown-it');
const markdownItReplaceLink = require('markdown-it-replace-link');
*/
// taken from https://11ty.rocks/eleventyjs/slugs-anchors/#enable-anchor-links-on-content-headings
// npm install --save-dev markdown-it-anchor slugify
// Import prior to `module.exports` within `.eleventy.js`
const markdownIt = require("markdown-it");
const markdownItAnchor = require("markdown-it-anchor");
// If not already added from previous tip
const slugify = require("slugify");
const eleventyComputed = require("./src/_data/eleventyComputed.js")();
//const { eleventyImageTransformPlugin } = require("@11ty/eleventy-img");


const linkAfterHeader = markdownItAnchor.permalink.linkAfterHeader({
  class: "anchor",
  symbol: "<span hidden>#</span>",
  style: "aria-labelledby",
});

// Define options for markdown-it-anchor
const markdownItAnchorOptions = {
  level: [1, 2, 3],
  slugify: (str) =>
    slugify(str, {
      lower: true,
      strict: true,
      remove: /["]/g,
    }),
  tabIndex: false,
  permalink(slug, opts, state, idx) {
    state.tokens.splice(
      idx,
      0,
      Object.assign(new state.Token("div_open", "div", 1), {
        // Add class "header-wrapper [h1 or h2 or h3]"
        attrs: [["class", `heading-wrapper ${state.tokens[idx].tag}`]],
        block: true,
      })
    );

    state.tokens.splice(
      idx + 4,
      0,
      Object.assign(new state.Token("div_close", "div", -1), {
        block: true,
      })
    );

    linkAfterHeader(slug, opts, state, idx + 1);
  },
};

/* Markdown Overrides */
let markdownLibrary = markdownIt({
  html: true,
}).use(markdownItAnchor, markdownItAnchorOptions);


const path = require("path");
const fs = require("fs");


module.exports = async function (eleventyConfig) {
  const { EleventyHtmlBasePlugin } = await import("@11ty/eleventy");
  eleventyConfig.addGlobalData("eleventyComputed", eleventyComputed);
  //eleventyConfig.addPlugin(eleventyImageTransformPlugin);

	eleventyConfig.addPlugin(EleventyHtmlBasePlugin);
  // This is the part that tells 11ty to swap to our custom config
  eleventyConfig.setLibrary("md", markdownLibrary);

  

  // Add a collection for pages
  eleventyConfig.addCollection("content", function(collection) {
    return collection.getFilteredByGlob("src/content/**/*.md");
  });


  eleventyConfig.addFilter("formatDate", (dateObj) => {
    return DateTime.fromJSDate(dateObj, { zone: 'utc' }).toISODate();
  });

  eleventyConfig.addPassthroughCopy("src/imgs/");//add folders to public
  eleventyConfig.addPassthroughCopy("src/attachments/");
  eleventyConfig.addPassthroughCopy("src/_data/ateliers.json");
  eleventyConfig.addPassthroughCopy("src/js/");
  eleventyConfig.addPassthroughCopy("src/css/fonts/");
  eleventyConfig.addPassthroughCopy("CNAME");
  //eleventyConfig.addPassthroughCopy({ "content/index.en.md": "/index.md" });
  
  //eleventyConfig.addGlobalData("langs", ['en', 'fr']);
  
  //eleventyConfig.addCollection("en", function (collection) {
  //  return collection.getFilteredByGlob("./src/content/**/*.en.+(md|njk)");
  //});
  //eleventyConfig.addCollection("fr", function (collection) {
  //  return collection.getFilteredByGlob("./src/content/**/*.fr.+(md|njk)");
  //});
  //following snippet from https://cfjedimaster.github.io/eleventy-blog-guide/guide.html
  




  eleventyConfig.addShortcode('excerpt', post => extractExcerpt(post));
	function extractExcerpt(post) {
		if(!post.templateContent) return '';
		// Define a regex pattern to match the first closing tag of p, a, or li
		const match = post.templateContent.match(/<\/p>/);
		if (match) {
			let end = match.index + match[0].length;
      let excerpt = post.templateContent.substr(0, end)
      excerpt = excerpt.replace(/<\/p>/, ' [...]</p>');
			return excerpt;
		}
		return post.templateContent;
	}
/*
  eleventyConfig.addFilter("excerpt", (post) => {
    const content = post.replace(/(<([^>]+)>)/gi, "");
    return content.substr(0, content.lastIndexOf(" ", 500)) + "...";
  });
*/
  // Custom data function to set the buildTime
  eleventyConfig.addGlobalData('buildTime', () => {
    return new Date().toISOString().slice(0, 10);
  });
  eleventyConfig.addFilter('main', (content) => {
    const separator = '<!--section-->';
    const parts = content.split(separator);
    return parts[0];
  });
  eleventyConfig.addFilter('sidenote', (content) => {
    const separator = '<!--section-->';
    const parts = content.split(separator);
    return parts[1];
  });

  return {
    dir: {
      input: 'src',
      includes: '_includes',
      layouts: '_layouts',
      data: '_data',
      output: 'public',
    },
    pathPrefix: "/mtl-avc-reseau/",
    templateFormats: ['html', 'md', 'njk','css'],//copy any files with these extensions to _site
    htmlTemplateEngine: 'njk',
    markdownTemplateEngine: 'njk',
    dataTemplateEngine: 'njk'
  };
};