import { visit } from "unist-util-visit";

export default function rehypeImageFallback(options = {}) {
	const {
		enable = true,
		originalDomain = "sb-eo-r2.2x.nz",
		fallbackDomain = "pub-d433ca7edaa74994b3d7c40a7fd7d9ac.r2.dev",
	} = options;

	return (tree) => {
		visit(tree, "element", (node) => {
			if (node.tagName === "img" && node.properties) {
				const src = node.properties.src;
				const alt = node.properties.alt || "";

				// Support sizing pattern in alt text: ![alt | width=70%](src)
				if (typeof alt === "string" && alt.includes("|")) {
					const parts = alt.split("|");
					const newAlt = parts[0].trim();
					const params = parts[1].trim();
					
					// Update alt to remove the params
					node.properties.alt = newAlt;

					// Parse width and height from params, e.g., "width=70%" or "70%x70%"
					const widthMatch = params.match(/width[=:]\s*([^\s,]+)/i) || params.match(/^(\d+%?)$/);
					const heightMatch = params.match(/height[=:]\s*([^\s,]+)/i);

					if (widthMatch) {
						node.properties.style = `${node.properties.style || ""}; width: ${widthMatch[1]}; height: ${heightMatch ? heightMatch[1] : "auto"};`;
						// Center if it's not full width
						if (widthMatch[1] !== "100%") {
							node.properties.style += " margin: 0 auto; display: block;";
						}
					}
				}

				// If width/height attributes are already present (from HTML tags), transfer them to style
				// to ensure they work better with dynamic layouts
				if (node.properties.width && !node.properties.style?.includes("width:")) {
					node.properties.style = `${node.properties.style || ""}; width: ${node.properties.width}${typeof node.properties.width === "number" || /^\d+$/.test(node.properties.width) ? "px" : ""};`;
				}
				if (node.properties.height && !node.properties.style?.includes("height:")) {
					node.properties.style = `${node.properties.style || ""}; height: ${node.properties.height}${typeof node.properties.height === "number" || /^\d+$/.test(node.properties.height) ? "px" : ""};`;
				}

				// Existing fallback logic
				if (enable && typeof src === "string" && src.includes(originalDomain)) {
					const fallbackSrc = src.replace(originalDomain, fallbackDomain);
					node.properties.onerror = `this.onerror=null; this.src='${fallbackSrc}';`;
				}
			}
		});
	};
}
