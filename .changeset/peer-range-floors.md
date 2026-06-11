---
'@osdlabel/fabric-annotations': patch
'@osdlabel/fabric-osd': patch
'@osdlabel/osd-helper': patch
'osdlabel': patch
'@osdlabel/react': patch
'@osdlabel/solid': patch
---

Widen the published `fabric` and `openseadragon` peer ranges from exact pins to caret ranges (`fabric: ^7.4.0`, `openseadragon: ^5.0.1`) to reduce install friction in monorepos and shared-install setups. The `fabric` floor stays at 7.4.0 to exclude the <7.4 CVE. Dev/workspace installs remain pinned to exact versions via the default pnpm catalog; the ranges are sourced from a new named `peers` catalog used only in `peerDependencies`.
