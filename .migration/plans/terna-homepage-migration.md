# Terna Homepage Migration Plan (https://www.terna.it/it)

## Goal
Bring the Terna Italian homepage (`/it`) over to AEM Edge Delivery Services, along with the site header (navigation) and footer. The result should be authorable content that looks like the original in the local preview.

## Context
- **Project:** Document Authoring (DA). The content source is `gscamurra/terna`, and branch previews use `{branch}--terna--gscamurra.aem.page`.
- **Starting point:** This is a clean boilerplate repo with the standard blocks (hero, cards, columns, header, footer, fragment). No import setup or migrated content exists yet.
- **Scope:** One page (the homepage), plus a nav fragment and a footer fragment shared by every page.
- **Language:** All content stays in Italian. The page will live at `/it/index`, matching the source path.
- **Surfaces:** All changes stay in the local workspace. Nothing goes to DA, EDS preview or live unless you ask for it separately.

## Approach

### Phase 1: Page migration (content + blocks)
1. **Analyse the page.** Scrape `https://www.terna.it/it` and take screenshots. Find the sections, blocks and authoring decisions (hero, carousels or news, cards, stats or teasers, CTAs).
2. **Map blocks.** Name the block variants, reusing existing ones where they are at least 80% similar. Record DOM selectors and section mappings in the page templates file.
3. **Generate blocks.** Create any custom blocks the analysis calls for (for example a carousel, news teasers or stats). Scope the CSS to each block and decorate defensively, since authors may omit or add cells.
4. **Build the importer.** Generate parsers and transformers, including cleanup of cookie banners and the site's own header and footer. Bundle the template import script.
5. **Import the content.** Run the bulk import to produce `/it/index.plain.html`, then check the result in the preview.

### Phase 2: Design
6. **Extract site-wide design tokens.** This covers colours, the Terna font stack, spacing and buttons, mapped to CSS custom properties in `styles/`.
7. **Style each block.** Match each migrated block to the source's computed styles.

### Phase 3: Header / navigation
8. **Detect nav rows.** Find the top utility bar (language switch, search, other links) and the main nav.
9. **Analyse the megamenu.** Hover over each top-level item to capture its submenu content.
10. **Check mobile behaviour.** Capture the hamburger menu and its drawer or accordion pattern.
11. **Build the nav.** Create `nav.plain.html` and update `blocks/header`, then validate desktop and mobile against the source.

### Phase 4: Footer
12. **Detect and map footer sections.** This includes link columns, social icons, legal and copyright text, and the company info.
13. **Build the footer.** Create `footer.plain.html`, update `blocks/footer`, and validate desktop and mobile.

### Phase 5: Final QA
14. **Compare the full page.** Run a visual critique of the whole page against the original and fix any remaining differences.
15. **Run lint.** Run `npm run lint` on all new or changed block code.
16. **Summarise.** Report what changed (local workspace only) and note any known gaps, such as dynamic or JS-driven widgets that can't be authored.

## Checklist
- [ ] Analyse the homepage structure, sections and block variants
- [ ] Map blocks and sections in the page templates file
- [ ] Generate any custom blocks the homepage needs
- [ ] Generate import parsers and transformers
- [ ] Bundle the import script and run the homepage import (`/it/index`)
- [ ] Check the imported content in the preview
- [ ] Extract and apply site-wide design tokens (colours, fonts, spacing, buttons)
- [ ] Style each migrated block to match the source
- [ ] Migrate the header: rows, megamenu and mobile behaviour, then build `nav.plain.html` and the header block
- [ ] Validate the header on desktop and mobile
- [ ] Migrate the footer: sections and mapping, then build `footer.plain.html` and the footer block
- [ ] Validate the footer on desktop and mobile
- [ ] Run the full-page visual critique and fix remaining differences
- [ ] Lint the block code
- [ ] Write a final summary of what changed (local only) and any known limitations

## Risks / Notes
- **Bot protection:** If terna.it blocks automated scraping, the scrape step falls back to an alternative fetch method.
- **Dynamic widgets:** Elements like the energy data dashboards or live charts on the source may not be authorable as content. They may become static teasers or simplified blocks, and I'll flag them in the summary.
- **Megamenu size:** If the nav megamenu is very large, the nav fragment will be long. That still fits the standard authoring pattern.
- **Execution:** Running this plan requires switching to Execute mode. Nothing has been changed yet.
