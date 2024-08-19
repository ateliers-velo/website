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

const linkAfterHeader = markdownItAnchor.permalink.linkAfterHeader({
  class: "anchor",
  symbol: "<span hidden>#</span>",
  style: "aria-labelledby",
});
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

module.exports = function (eleventyConfig) {
  
  // This is the part that tells 11ty to swap to our custom config
  eleventyConfig.setLibrary("md", markdownLibrary);
  /*
    // https://www.npmjs.com/package/markdown-it-replace-link
    eleventyConfig.setLibrary('md', markdownIt({
      html: true,
      linkify: true
    }).use(markdownItReplaceLink, {
      processHTML: true, // defaults to false for backwards compatibility
      replaceLink: function (link, env, token, htmlToken) {
        return "https://atlascine.org/en/" + link;//incomplete, need to integrate language dynamically
      }
    }));
  */
  eleventyConfig.addFilter("formatDate", (dateObj) => {
    return DateTime.fromJSDate(dateObj).toISODate();
  });

  eleventyConfig.addPassthroughCopy("src/imgs/");//add folders to public
  eleventyConfig.addPassthroughCopy("src/js/");
  eleventyConfig.addPassthroughCopy("CNAME");
  eleventyConfig.addPassthroughCopy({ "en/index.md": "/index.md" });
  //eleventyConfig.addGlobalData("langs", ['en', 'fr']);
  eleventyConfig.addCollection("en", function (collection) {
    return collection.getFilteredByGlob("./src/en/**/*.+(md|njk)");
  });
  eleventyConfig.addCollection("fr", function (collection) {
    return collection.getFilteredByGlob("./src/fr/**/*.+(md|njk)");
  });
  //following snippet from https://cfjedimaster.github.io/eleventy-blog-guide/guide.html
  /*
  eleventyConfig.addShortcode('excerpt', post => extractExcerpt(post));
	function extractExcerpt(post) {
		if(!post.templateContent) return '';
		// Define a regex pattern to match the first closing tag of p, a, or li
		const match = post.templateContent.match(/<\/(p|a|li)>/);
		if (match) {
			let end = match.index + match[0].length;
			return post.templateContent.substr(0, end);
		}
		return post.templateContent;
	}
  */
  eleventyConfig.addFilter("excerpt", (post) => {
    const content = post.replace(/(<([^>]+)>)/gi, "");
    return content.substr(0, content.lastIndexOf(" ", 500)) + "...";
  });
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
    templateFormats: ['html', 'md', 'njk','css'],//copy any files with these extensions to _site
    htmlTemplateEngine: 'njk',
    markdownTemplateEngine: 'njk',
    dataTemplateEngine: 'njk'
  };
};
