# widget-live-data

Custom **widget** block. Purpose: Boxed live data figures (value, delta, label, last update) from dati.terna.it.

## Authoring (Document Authoring)

Model: `standalone`

Single block table. Content: either one cell with a link to /widgets/<path>/<name>.html (loads the live widget), or a snapshot table with one row per box: title | zone | value | delta | label | last update (one cell each, or one cell with one paragraph each). Delta (a percentage), value (starts with a number) and the last-update line are recognised by content, so any can be omitted.

## Supported variations

No variations.

## Universal Editor fields

N/A (Document Authoring project)
