# Kepler UI

## Sci-Fi inspired, web component-based UI kit

The Kepler UI Kit is a modern and flexible UI library built entirely with Web Components, making it an ideal choice for developers looking for a framework-agnostic, dependency-free solution for building user interfaces. Using a science-fiction inspired design system, It provides a consistent, customizable, and extendable set of UI components that can be used across a variety of projects, from static websites to complex web applications.

# Installation

Getting started with the Kepler UI kit is incredibly straight-forward. All you have to do is include the JavaScript and CSS files in your project, and your components should work right out of the box.

## Setup

### Using a CDN

You only need to include the kepler-ui.js script at the end of your document body

```html
<script src="https://kepler-ui.s3.us-west-2.amazonaws.com/kepler-ui.js"></script>
```

You can also include the stylesheet at the beginning of your document, although this is optional. Kepler components are self styled, but this stylesheet will style everything else on your site to match.

```html
<link
    type="stylesheet"
    src="https://kepler-ui.s3.us-west-2.amazonaws.com/styles/main.css"
/>
```

### Using a Package Manager

Download the package from npm

```bash
# npm
npm install kepler-ui
```

```bash
# yarn
yarn add kepler-ui
```

Then import the library into your JavaScript:

```javascript
import "kepler-ui";
```

## Example

No configuration beyond adding the required JavaScript and optional CSS stylesheets to your project. Once they are included, you can add components to your html:

```html
<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8" />
        <link
            rel="stylesheet"
            href="https://kepler-ui.s3.us-west-2.amazonaws.com/styles/main.css"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Kepler App</title>
    </head>
    <body>
        <kp-theme
            theme-path="https://kepler-ui.s3.us-west-2.amazonaws.com/styles/kepler-dark.css"
        >
            <div id="app">
                <h1>Welcome!</h1>
                <kp-button>Click Me</kp-button>
            </div>
        </kp-theme>

        <script
            type="module"
            src="https://kepler-ui.s3.us-west-2.amazonaws.com/kepler-ui.js"
        ></script>
    </body>
</html>
```

## Playground

This repository also includes a playground for testing components in a dev environment. The source files are located in `public`. To use it, first install the required dev dependencies:

```bash
# npm
npm install

# yarn
yarn install
```

Then run the server script

```bash
# npm
npm run dev

# yarn
yarn run dev
```

The site will automatically recompile the `dist` and `pub` directories when changes are made to either the `src` or `public` directories.
