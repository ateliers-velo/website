//import these modules
const path = require("path");
const slugify = require("slugify");
const fs = require("fs");

module.exports = function () {
  //TO DO : build 1 collection per folder, to maintain context of other lang version
  return {
    translationKey: (data) => {
      const inputPath = data.page.inputPath;
      // Ensure the main index.njk file is placed at the root
      if (path.basename(inputPath) === "index.njk") {
        console.log("Redirect index.njk detected, placing at /index.html");
        return "/index.html"; // Force top-level placement
      }

      // Extract the parent folder name from the input path
      const folderName = path.basename(path.dirname(inputPath)); // Parent folder of the current file
      console.log("translationKey: ", folderName);

      return slugify(folderName, { lower: true, strict: true });
    },
    //generate lang var from filename, default to fr if no lang var detected in filename
    //filenames should not use points unless used to separate filename from lang var
    lang: (data) => {
      const fileSlugParts = data.page.fileSlug.split(".");
      const l = fileSlugParts.length > 1 ? fileSlugParts.slice(-1)[0] : "fr";
      console.log("---")
      console.log("lang: ", l)
      return l;
    },
    //generate a var containing a clean file path
    folderName: (data) => {
      const fp = path
        .relative("src/content", path.dirname(data.page.inputPath))
        .replace(/\\/g, "/")
        .split("/")
        .filter((segment) => segment.length > 0)
        .map(segment => slugify(segment, { lower: true, strict: true }))
        .join("/");
      console.log("folderName: ", fp)
      return fp;
    },
    //generate slug from filename (cleans out any spaces, etc.)
    //title
    fileName: (data) => {
      const fileNameParts = data.page.fileSlug.split(".");
      let fileName = fileNameParts.slice(0, -1).join("-") || fileNameParts[0];
    
      // Ensure "index" files don’t inherit the folder name as a title
      if (fileName === "content" || fileName === "index") {
        return "";
      }
    
      console.log("fileName: ", fileName);
      return slugify(fileName, { lower: true, strict: true });
    },
    

    permalink: (data) => {

      const inputPath = data.page.inputPath;
      // Ensure the main index.njk file is placed at the root
      if (path.basename(inputPath) === "root-redirect-to-fr.njk") {
        console.log("Redirect root-redirect-to-fr.njk detected, placing at /index.html");
        return "/index.html"; // Force top-level placement
      }
      
      const fp = data.folderName;
      const lang = data.lang;
      const titleSlug = data.fileName;
    
      let permalink;
      if (fp) {
        permalink = `/${lang}/${fp}/${titleSlug}/`;
        console.log('1 folderName/lang')
      } else if (titleSlug) {
        permalink = `/${lang}/${titleSlug}/`;
        console.log('2 lang/titleSlug')
      } else {
        permalink = `/${lang}/`;
        console.log('3 lang only')
      }
    
      console.log("permalink: ", permalink);
      return permalink;
    }
    
  };
};
