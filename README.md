# IPP Used Reactors, page prototype

Static prototype of the International Process Plants used reactors hub page.

All body copy, headings and section order are taken verbatim from the live page at
`internationalprocessplants.com/process-equipment/reactor/`. The product display is rebuilt
around a filter rail and a card grid.

## Structure

```
.
├── index.html                the full page
├── build.py                  stamps content hashes onto the asset URLs
├── inventory.json            the 56 real units the grid is built from
├── ims-reactor-facets.json   facet schema captured from IPP's inventory system
├── vercel.json               static hosting config, headers and caching
└── assets
    ├── css
    │   └── style.css         all page styles
    └── js
        └── main.js           tabs, hero read more, inventory filter
```

## After editing anything under assets/

```bash
python3 build.py
```

This rewrites the `?v=` stamp on the stylesheet and script to a hash of their own
contents. Without it a browser that cached the old files keeps serving them, and
the page renders new markup against an old stylesheet and an old script. That is
exactly what happened once already, so the step is not optional.

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
