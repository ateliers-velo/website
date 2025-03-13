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
  
  
  // Load the global page config (stored in src/pages/pages.json)
  const globalPageConfig = require("./src/content/content.json");

  // Add a collection for pages
  eleventyConfig.addCollection("content", function(collection) {
    return collection.getFilteredByGlob("src/content/**/*.md");
    /*
    return content.map(item => {
      
      // Get full path name minus the file's parent folder name. This ensures that a-propos.md and about.md (both contained in the same parent folder) will be visible in the permalink
      const folderName = path.relative("src/content", path.dirname(item.inputPath))
        .replace(/\\/g, "/") // Normalize for cross-platform use
        .split("/")
        .slice(0, -1)
        .filter(segment => segment.length > 0)
        .join("/");

      // Get the language from the file name (e.g., `index.en.md` -> lang = "en")
      const lang = item.fileSlug.split(".")[1];
      const fileName = item.fileSlug.split(".")[0];
      const titleSlug = fileName ? slugify(fileName, { lower: true, strict: true }) : "untitled";
      const permalink = folderName ? `${lang}/${folderName}/${titleSlug}/` : `/${lang}/${titleSlug !== "index" ? titleSlug + "/" : ""}`;

      console.log(`Processing: ${item.inputPath}`);
      console.log(` → folderName: ${folderName}`);
      console.log(` → titleSlug: ${titleSlug}`);
      console.log(` → permalink: ${permalink}`);

      // Assign global settings from the page config
      item.data.layout = globalPageConfig.layout;
      item.data.lang = lang;
      item.data.permalink = permalink;


      // Log the final output path
      const outputPath = path.join("public", permalink, "index.html");
      console.log(` → outputPath: ${outputPath}`);
      console.log(` → Final assigned permalink for ${item.inputPath}: ${item.data.permalink}`);

      return item;
    });
    */
  });


  eleventyConfig.addFilter("formatDate", (dateObj) => {
    return DateTime.fromJSDate(dateObj, { zone: 'utc' }).toISODate();
  });

  eleventyConfig.addPassthroughCopy("src/imgs/");//add folders to public
  eleventyConfig.addPassthroughCopy("src/js/");
  eleventyConfig.addPassthroughCopy("CNAME");
  //eleventyConfig.addPassthroughCopy({ "content/index.en.md": "/index.md" });
  
  //eleventyConfig.addGlobalData("langs", ['en', 'fr']);
  eleventyConfig.addCollection("en", function (collection) {
    return collection.getFilteredByGlob("./src/content/**/*.en.+(md|njk)");
  });
  eleventyConfig.addCollection("fr", function (collection) {
    return collection.getFilteredByGlob("./src/content/**/*.fr.+(md|njk)");
  });
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
    templateFormats: ['html', 'md', 'njk','css'],//copy any files with these extensions to _site
    htmlTemplateEngine: 'njk',
    markdownTemplateEngine: 'njk',
    dataTemplateEngine: 'njk'
  };
};








