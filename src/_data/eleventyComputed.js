//import these modules
const path = require("path");
const slugify = require("slugify");
const fs = require("fs");

module.exports = function () {
  // at the very top of src/_data/eleventyComputed.js
  console.log("✅ eleventyComputed.js loaded");

  //TO DO : build 1 collection per folder, to maintain context of other lang version
  return {
    translationKey: (data) => {
      console.log("---")
      if (!data.translationKey || typeof data.translationKey !== "string" || data.translationKey.trim() === "") {
        console.log(`⚠️ Missing translationKey`);
        //the site can support more than 2 languages, however the display of other lang content when a selected language lacks a translation only works for 2 languages currently (see list-index-pages and navbar)
        const inputPath = path.dirname(data.page.inputPath);
        const folderName = path.basename(inputPath);
        console.log("inputPath ", inputPath)
        console.log("folderName ", folderName)
        const allPages = data.collections.all || [];
        // Filter pages that are in the same directory as the current file
        const filesInSameDir = allPages.filter((page) => path.dirname(page.inputPath) === inputPath);
        
        // THERE IS currently no way to see the filename or lang attribute of the elements inside filesInSameDir
        console.log("filesInSameDir ", filesInSameDir.length)
        // thus, if two files appear in a same directory with data.site.languages.length === 2, they are assumed translations of each other. this is a limitation/bug not yet resolved
        if (filesInSameDir.length === data.site.languages.length) {
          const translationKey = slugify(folderName, { lower: true, strict: true })
          console.log("translationKey: ", translationKey);
          return translationKey;
        } else {
          console.log("⚠️ No translationKey for ", folderName);
          return false;
        }
      } else {
        console.log('already has translationKey')
        return data.translationKey;
      }
    },
    //generate lang var from filename, default to en if no lang var detected in filename
    //filenames should not use points unless used to separate filename from lang var
    lang: (data) => {
      //ensures that every template has a title, whether based on the filename or the editor's explicit title in frontmatter
      if (!data.lang || typeof data.lang !== "string" || data.lang.trim() === "") {
        console.log(`⚠️ Missing lang, using filename ending as lang`);
        const fileSlugParts = data.page.fileSlug.split(".");
        const l = fileSlugParts.length > 1 ? fileSlugParts.slice(-1)[0] : data.site.defaultLang;
        console.log("lang: ", l)
        return l;
      }
      return data.lang;
    },
    //generate a var containing a clean file path
    folderName: (data) => {
      const fp = path
        .relative("src/content", path.dirname(data.page.inputPath))
        .replace(/\\/g, "/")
        .split("/")
        .filter((segment) => segment.length > 0)
        .map(segment => slugify(segment, { lower: true, strict: true }))
        .slice(0,-1)
        .join("/");
      console.log("folderName: ", fp)
      return fp;
    },
    //generate slug from filename (cleans out any spaces, etc.)
    //title
    fileName: (data) => {
      const fileNameParts = data.page.fileSlug.split(".");
      let fileName = fileNameParts.slice(0, -1).join(" ") || fileNameParts[0];
      console.log("fileName: ", fileName);
      return fileName;
    },
    fileNameSlug: (data) => {
      const fileNameParts = data.page.fileSlug.split(".");
      let fileNameSlug = fileNameParts.slice(0, -1).join("-") || fileNameParts[0];
      fileNameSlug = slugify(fileNameSlug, { lower: true, strict: true })
      // Ensure "index" files don’t inherit the folder name as a title
      console.log("fileNameSlug: ", fileNameSlug);
      return fileNameSlug;
    },
    title: (data) => {
      //ensures that every template has a title, whether based on the filename or the editor's explicit title in frontmatter
      if (!data.title || typeof data.title !== "string" || data.title.trim() === "") {
        console.log(`⚠️ Missing title in: ${data.page.inputPath}`);
        console.log(`⚠️ Using '${data.fileName}' as title`);
        return data.fileName; // Provide a default fallback if title is missing
      }
      return data.title;
    },
    titleSlug: (data) => {
      return slugify(data.title, { lower: true, strict: true });
    },
    permalink: (data) => {

      // PERMALINK MANIPULATION EXCLUSIONS
      if (!data.permalink || typeof data.permalink !== "string" || data.permalink.trim() === "") {
        if (data.permalink === false) {
          // If permalink is explicitly set to false, return it as-is (don't generate a new one)
          console.log("Permalink is explicitly false, leaving as-is.");
          return data.permalink; // Eleventy will respect this and not generate a new one
        } else {
          const inputPath = data.page.inputPath;
          // Ensure the main index.njk file is placed at the root
          if (path.basename(inputPath) === "index.njk") {
            console.log("Redirect index.njk detected, placing at /index.html");
            return "/index.html"; // Force top-level placement
          }
          
          const folderName = data.folderName;
          const lang = data.lang;
          const fileNameSlug = data.fileNameSlug;
          const titleSlug = data.titleSlug;
        
          let permalink;

          if (folderName) {
            permalink = `/${lang}/${folderName}/${titleSlug}/`;
          } else if (fileNameSlug === "content" || fileNameSlug === "index") {
            permalink = `/${lang}/`;
          } else if (titleSlug) {
            permalink = `/${lang}/${titleSlug}/`;
          }
        
          console.log("permalink: ", permalink);
          return permalink;
        }
      
      // else if (data.collections.post && data.permalink) {
        // if a blog post, leave permalinks set by posts.json
        //return data.permalink
      //}
      } else {
        return data.permalink
      }
    
    },
    date: (data) => {
      // If date is "git Created" and gitCreated is available, use gitCreated
      if (data.date === "git Created" && data.gitCreated) {
        return data.gitCreated;
      }
      // Otherwise, use the existing date value
      return data.date;
    },
  };
};
