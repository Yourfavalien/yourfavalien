# Chrome logo refresh review

Replaces Support header, footer and mobile-menu logos with the cleaned YFA monogram. Known legacy Worker logo URLs map to the local chrome asset, including when remote settings reload. The main site's favicon and Apple touch icon use the matching chrome identity; icon links are versioned to refresh caches. The signup-popup cartoon logo uses the monogram in its original square frame; the welcome-template signature uses the full-name wordmark in its original frame.

[Desktop comparison](support-desktop-comparison.png) · [Mobile comparison](support-mobile-comparison.png) · [Favicon rendering](favicon-rendering.png)

[Popup before](before-popup-mobile.png) · [Popup after](after-popup-mobile.png) · [Welcome before](before-welcome-mobile.png) · [Welcome after](after-welcome-mobile.png)

The original PNG files are retained byte-for-byte. Clean derivatives keep the same RGB artwork and native dimensions; only opacity is lifted (alpha exponent 0.6) and the monogram's detached board-label pixels in rows 0–9 are made transparent. The artwork begins at row 32, so no YFA strokes are removed. No generative model or new artwork was used.

Favicons derive from the supplied four-point star with alpha exponent 0.4. The monogram was unreadable at 16px. PNG favicons are 512×512; ICO includes 16, 32, 48, 64, 128 and 256px; Apple touch icons are 180×180. Images retain transparent backgrounds and proportional scaling. Enlarging icon exports does not create additional source detail. Silver chrome naturally has less contrast on white; Support logos have a subtle shadow limited to the image.

Validation used local Chromium at 1440px desktop and 390px mobile widths. Full-page captures and header comparisons were inspected. All nine Support pages passed logo-load and horizontal-overflow checks at both widths; mobile navigation and Escape closing worked. Public HQ and login layouts, popup, welcome template and owner-control shell were checked. Protected partner/admin server sessions were not authenticated; their shared static logo placements were inspected without changing access controls.

Existing videos, background artwork, photos, page copy, navigation, settings storage and authentication remain unchanged. Text-only headings/wordmarks and the welcome email's decorative UFO emoji are retained. Branding baked into videos, hero/banner artwork, social-preview artwork and the BIMI identity is not replaced because those are separate artwork/email-identity changes. Legacy public UFO-logo filenames now serve matching chrome artwork for cached/external references. The legacy Headquarters SVG also uses the full-name chrome wordmark. Support owner preview fields map known legacy Worker logo URLs without editing stored settings.

Screenshots show local repository pages, not deployed versions. The icon sheet shows browser-rendered images at favicon sizes on light and dark surfaces, rather than a browser tab-bar capture.

[Complete changed-file list](changed-files.txt)
