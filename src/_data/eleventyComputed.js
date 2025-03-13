const path = require("path");
const slugify = require("slugify");
const fs = require("fs");

module.exports = function () {
  // Load global config (e.g., default layout)
  const contentPath = path.join(__dirname, "../content/content.json");
  let globalPageConfig = {};

  if (fs.existsSync(contentPath)) {
    globalPageConfig = require(contentPath);
  }

  return {
    lang: (data) => {
      const fileSlugParts = data.page.fileSlug.split(".");
      return fileSlugParts.length > 1 ? fileSlugParts.slice(-1)[0] : "en"; // Default to English
    },

    folderName: (data) => {
      return path
        .relative("src/content", path.dirname(data.page.inputPath))
        .replace(/\\/g, "/")
        .split("/")
        .slice(0, -1)
        .filter((segment) => segment.length > 0)
        .join("/");
    },

    titleSlug: (data) => {
      const fileName = data.page.fileSlug.split(".")[0];
      return fileName ? slugify(fileName, { lower: true, strict: true }) : "untitled";
    },

    permalink: (data) => {
      const folderName = path
        .relative("src/content", path.dirname(data.page.inputPath))
        .replace(/\\/g, "/");
      const lang = data.lang;
      const titleSlug = data.titleSlug;

      return folderName
        ? `/${lang}/${folderName}/${titleSlug}/`
        : `/${lang}/${titleSlug !== "index" ? titleSlug + "/" : ""}`;
    },

    layout: (data) => {
      return globalPageConfig.layout || "basic.html"; // Default to "basic.html" if not defined
    },
  };
};
