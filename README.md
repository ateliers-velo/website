# bumbum-website

Built using Eleventy and Nunjucks, with a custom build process to generate the site in more than one language. Root redirect functionality adapted from [this code](https://gist.github.com/BrianMitchL/f93622a46f4476b7514995ff502d8d17).

website URL: https://maphouse.github.io/mtl-avc-reseau

## to edit content

- Find the webpage document you want to edit under /src/content/. Wherever possible, keep documents organized under relevant subdirectories (projects, pages, posts).
- Click the pencil icon on the top-right to edit a file.
  - The edits you make should use [markdown syntax](https://www.markdownguide.org/cheat-sheet/).
  - When adding an image, make sure you've uploaded the image to *src/imgs/* and refer to the image as follows: `![Alt text](/imgs/logo.png "Mouseover caption text")`
- Once satisfied with your edit, hit *Commit changes...* to save your edits.

## to create a new page

- Locate where you want to create a new webpage.
- Hit *Add file* > *Create new file*
- Give it a name with *.md* as its file extension
- you can now [add some content](#to-edit-content).

This is the bare minimum for a page to be published. However, there are several settings you can define explicitly for a webage (see next section), allowing you more control.

# Required information for a page to function

Here are the parameters (i.e. *frontmatter*) that the system uses for a page to function properly on the website.

```json
---
layout: 'basic.html'
tags: [nav-items, index-pages]
title: 'À propos'
lang: 'fr'
translationKey: 'about'
permalink: '/fr/a-propos-de-nous/'
---
```

While each parameter can be described explicitly on a per-document basis, everything will also function without defining any of these parameters, since they all have defaults. For example, if layout is undefined, the document will have the site's default layout. If permalink is undefined, the URL of the page will be equivalent to `/lang/directory/title`. If title is undefined, the title will be the file name of the document (e.g. *à propos.md* will have the title *à propos* and url *a-propos*). If lang is undefined, and if it is not in the filename either (see next section), it will inherit the site's default language. Finally, tags designate where the document is displayed on the website: for example, in the navbar menu and/or in the footer at the page index list.

- **tags**: if you would like your new page to appear in the navigation menu at the top of the website, include the *nav-items* tag; if you would like it to appear in the list of footer links, include the *index-pages* tag; if you would like the page to appear in the gallery on the browse-atlases page, include the *projects* tag. If you are including more than one tag, make sure to surround them with square brackets as seen above.
- The **translationKey** is used to point two map two translations to each other. For example, the /about page can use the *about* translationKey, but so would the /à-propos page in order for it to be considered a translation of /about.md. Using the same translationKey makes these pages related to eachother and allows the language buttons to work.
- **title** will render as a header at the top of your page by default. It will also be used to generate the url of the page (ex. *À Propos* will turn into the slug */à-propos*).
- **date** defaults to the date the file was created, but can be set explicitly to modify the order in which pages appear in either the navigation menu or the pages index.
- [...]


# Multilingual controls

In `./src/_data/site.json`:

- Set the website's available `languages`
- Set the website's default language by modifying `defaultLang`

A document's language is determined by its filename as long as it follows the convention *fileName.languageCode.md*. Files that don't follow this convention will default to `defaultLang`. For example, if `defaultLang` is `en`, then *index.md* will be considered to be in English, while a French document will need to be named as `index.fr.md`.

Alternatively, you can define a document's language by entering the language code in the document's frontmatter (e.g. `lang: 'en'`). This frontmatter parameter will take precedence if it is defined.

# Page translations

Documents without a specified language are considered to be in the site's default language. To create a translation for a document, there are two options:

- Add a frontmatter key called `translationKey` and give it a unique value. the same key-value pair must also be found in the translated document's frontmatter (e.g. an English and French version of an About page would both need `"translationKey": "about"` to display properly across the multilingual website).
- Use nested folders (this is the easier way): create a subfolder for the document and its translated version(s). As long as each document is a different language, they will appear as translations on the website.
