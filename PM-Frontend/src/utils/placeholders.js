// Placeholder images using inline SVG data URIs to avoid external network requests.
// This helps in offline environments or where placeholder.com is blocked.

export const placeholderSvg = ({
  width = 300,
  height = 200,
  bg = "#222222",
  fg = "#aaaaaa",
  text = "No Image",
}) => {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}'>` +
    `<rect width='100%' height='100%' fill='${bg}'/>` +
    `<text x='50%' y='50%' fill='${fg}' font-family='Arial, sans-serif' font-size='${Math.round(
      Math.min(width, height) / 10
    )}' text-anchor='middle' dominant-baseline='middle'>${text}</text>` +
    `</svg>`;

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
};

export const placeholderSmall = placeholderSvg({ width: 60, height: 60, text: "No Image" });
export const placeholderMedium = placeholderSvg({ width: 150, height: 150, text: "No Image" });
export const placeholderLarge = placeholderSvg({ width: 300, height: 200, text: "No Image" });
