# widget-ticker

Custom **widget** block. Purpose: Thin horizontal strip of share-price figures (Teleborsa ticker).

## Authoring (Document Authoring)

Model: `standalone`

Single block table. Content: either one cell with a link to /widgets/<path>/<name>.html (loads the live widget), or a snapshot table: row 1 = title | timestamp, each further row = label | value (values starting with - or + are flagged negative/positive). Scrolls as a marquee unless reduced motion is preferred.

## Supported variations

No variations.

## Universal Editor fields

N/A (Document Authoring project)
