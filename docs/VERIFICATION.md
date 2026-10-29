# Verification record

Run date: 29 October 2026. All model accuracy numbers below are synthetic, not human handwriting accuracy.

## Automated checks

`npm run typecheck` checks all application and test TypeScript under strict mode with unchecked index access.

`npm test` covers:

- Python/JavaScript feature and inference parity for exported fixtures.
- Vocabulary uniqueness and exact mapping between model classes and templates.
- First-ranked retrieval of every one of the 151 canonical templates.
- Translation, scale and point-density variation for representative characters.
- Blank marks, accidental tiny taps, and geometric fallback without the neural model.
- Correct, swapped, reversed, missing and additional strokes.
- Degenerate point sequences.
- Malformed imports, non-finite values, unknown characters, prototype validation and backup round trips.
- Review interval growth, relearning, due times, mastery rules and interval bounds.

The optimized complete canonical retrieval sweep takes about five seconds in the development container, compared with about 53 seconds before shortlisting. This is a local regression/performance check, not a mobile latency benchmark.

`npm run build` generates a static production build and a hashed cache list. Required assets are bundled rather than fetched from CDNs. The project also includes CI and GitHub Pages workflows.

## Browser verification

The cloud Chromium browser is used against the application preview. A horizontal pointer stroke is recognized as 一 while the selected character remains 永, verifying that the target does not supply the recognition answer. A two-stroke 十 drawn with the mouse was recognized first with 93% heuristic similarity; guided assessment returned 94% shape, 100% order and 100% direction. The goal advanced once. Search for unaccented `shi` found 十. Saving it increased the collection from eight to nine. A nine-card session disabled grading before reveal and ended on a completion screen. Export/import and reload preserved the nine saved cards, review due times, dark theme and one completed daily character. Undo removed exactly one stroke. No application-origin console errors were observed; unrelated browser-extension errors were excluded.

The final installed development toolchain passes all 14 tests and strict type checking. `npm audit` reports zero known vulnerabilities after updating Vite and Vitest. Browser QA used Chromium with mouse input. An actual iOS/Android device and a disconnected-network reload were not exercised in this environment.

## Reproduce manually

1. Open the production app and wait for **Listo sin conexión**. Draw a horizontal line left to right in **Libre**; expect 一 among the leading candidates.
2. Clear, draw a horizontal line and then a vertical line crossing it; expect 十. Select its candidate and compare shape, order and direction.
3. Search for 十, choose **Con guía**, and draw the two strokes in the indicated order. Repeat with the order swapped and the direction reversed; incorrect sequences should not pass.
4. Undo, resize the browser, change themes and return to the studio. Completed ink should remain unless a practice mode or target is deliberately changed.
5. Add a character, reload, and check the wallet. Export, import the same backup, and confirm that history does not duplicate.
6. Open review. Rating buttons should be disabled until reveal. Finish the queue; a completion screen should appear instead of an endless cycle.
7. After offline readiness, disconnect networking and reload the same origin. The app, model and bundled characters should remain usable. Browser storage or cache eviction can require a fresh connection.
8. At a narrow viewport, check the mobile tab bar, full-width studio, touch drawing, dialogs, keyboard focus and absence of horizontal overflow. Test on an actual iOS and Android device before claiming device validation.

## Not established

No independent human handwriting accuracy, physical pen-device compatibility, native iOS implementation, or exhaustive assistive-technology audit is claimed. Browser voice availability and installation prompts vary by platform. GitHub repository creation and Pages publication must be confirmed by the provider before they are reported as completed.
