# IPP Used Reactors, page prototype

Static prototype of the International Process Plants used reactors hub page.

All body copy, headings and section order are taken verbatim from the live page at
`internationalprocessplants.com/process-equipment/reactor/`. The product display is rebuilt
around a filter rail and a card grid.

## Structure

```
.
├── index.html              the full page
├── vercel.json             static hosting config, headers and caching
└── assets
    ├── css
    │   └── style.css       all page styles
    └── js
        └── main.js         tab switching and filter reset
```

No build step, no dependencies, no framework. Vercel serves it as a static site with zero
configuration. There is deliberately no `package.json`, so Vercel never attempts a build.

## Deploying

Import the repository at [vercel.com/new](https://vercel.com/new) and deploy. Leave the
framework preset as **Other** and leave the build and output settings empty.

To run it locally, any static server works.

```bash
npx serve .
```

## This deployment is set to noindex

Both `index.html` and `vercel.json` send `noindex, nofollow`. A public copy of a client page on a
`vercel.app` domain can be crawled, indexed, and can then compete with the real page for its own
search terms. Remove the meta tag in `index.html` and the `X-Robots-Tag` rule in `vercel.json`
only when the page moves to the production domain.

## Notes on the content

Product cards use real IPP stock numbers and real published specifications. Two items were left
exactly as they appear on the live site rather than silently corrected.

- The subtype filter reads **Tabular** on the live page where the section heading reads Tubular.
  Corrected here, still worth fixing at source.
- IPP stock number 200833 publishes `5.5 kW (7.4 HP` with no closing bracket.

Product images are placeholder line drawings marking where equipment photography belongs. The
live page currently carries no product photography at all.
