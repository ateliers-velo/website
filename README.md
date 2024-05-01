# bumbum-website

Contains files required to build the Atlascine website located at atlascine.org. Built using Eleventy and Nunjucks, with a custom build process to generate the site in more than one language. Redirect functionality based on [this code](https://gist.github.com/BrianMitchL/f93622a46f4476b7514995ff502d8d17).

## to edit content

- Find the webpage you want to edit under src/en/ or src/fr/. As you can see, pages are organized into either 'project' or 'pages' subdirectories.
- Click the pencil icon on the top-right to edit a file.
  - The edits you make should use [markdown syntax](https://www.markdownguide.org/cheat-sheet/).
- Once satisfied with your edit, hit *Commit changes...* to save your edits.

## to create a new page

- Locate where you want to create a new webpage (if in English, navigate to /src/en/, French, /src/fr/).
- Hit *Add file* > *Create new file*
- Give it a name with *.md* as its file extension
- Your page will require frontmatter to be added to the site properly. Frontmatter should be added at the top of the page and looks like this:
  ```
  ---
  layout: 'basic.html'
  tags: [nav-items, index-pages]
  translationKey: "about"
  title: 'About'
  date: 2023-06-14
  ---
  ```
   - Copy the above frontmatter to the beginning of your new page and modify the following values to your needs:
     - **tags**: if you would like your new page to appear in the navigation menu at the top of the website, include the *nav-items* tag; if you would like it to appear in the list of footer links, include the *index-pages* tag; if you would like the page to appear in the gallery on the browse-atlases page, include the *projects* tag. If you are including more than one tag, make sure to surround them with square brackets as seen above.
     - The **translationKey** is used to point two map two translations to each other. For example, the /about page uses the *about* translationKey, as does the /à-propos page. Using the same translationKey makes these pages related to eachother and allows the language buttons to work.
     - **title** will render as a header at the top of your page by default. It will also be used to generate the url of the page (ex. *À Propos* will turn into the slug */à-propos*).
     - **date** is optional and can be used to modify the order in which pages appear in either the navigation menu or the pages index.
- Once you have added the frontmatter, you can also [add some content](#to-edit-content).
  
