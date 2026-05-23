# @osdlabel/decoration

Declarative annotation decorations (text labels, computed measurements, connector lines) and calibrated geometry math for osdlabel.

Decorations are a **pure derivation** of annotation state — they are never serialized, and they are recomputed whenever the underlying annotations change. This package defines the data model and provider contract; the rendering happens in `@osdlabel/fabric-osd`.
