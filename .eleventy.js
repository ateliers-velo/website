// Import prior to `module.exports` within `.eleventy.js`
const { DateTime } = require("luxon");
/*
const markdownIt = require('markdown-it');
const markdownItReplaceLink = require('markdown-it-replace-link');
*/

module.exports = function (eleventyConfig) {
  
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
