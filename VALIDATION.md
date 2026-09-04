# Model X integration validation

- Replaced the procedural exterior with cgi Moon's detailed Model X asset, converted from Blender to glTF with embedded physical materials.
- 334 selectable source mesh islands / 343 draw meshes; these are geometry pieces, not 334 verified Tesla service parts.
- Source geometry includes body, glass, door panels, cabin trim and wheels. The three internal educational systems remain explicitly marked illustrative.
- Source car is pre-refresh; exact year and complete 2021+ parts coverage are not verified. These limits and creator attribution appear in the interface.
- Preserved mirror references during modifier evaluation; exported actual source tires without geometric replacement.
- Loaded the exported asset with Three.js GLTFLoader in Node, checked catalog correspondence and vehicle bounds: width 2.276 m, height 1.680 m, length 5.056 m.
- Rendered and visually inspected the exported glTF in Blender. Corrected misplaced mirrored parts and verified the assembled result. This is an asset check, not a browser screenshot.
- TypeScript and deployment build validated after the final application changes.
- Browser interaction QA was not requested and was not run. WebMCP registration is feature-detected; execution in a supported browser context remains unverified.

Source: https://www.blendkit.com/asset-gallery-detail/983e8f94-5a56-44a4-94d9-eed5e4cdcd6c/
License: https://www.blendkit.com/docs/licenses/ (Royalty Free; asset embedded in an educational application, with attribution and no download interface).

Conversion: scripts/convert-model.py requires Blender's bpy Python module and the original creator asset, with script execution disabled when loading it. Materials were adapted for browser rendering. Mesh names and grouping are descriptive spatial interpretations, not OEM identifiers.
