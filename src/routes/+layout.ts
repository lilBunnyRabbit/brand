// Prerender everything: this is a static brand guide with no server. adapter-static turns each
// route into one HTML file at build time.
export const prerender = true;

// `logo/index.html` rather than `logo.html`. GitHub Pages happens to resolve extensionless paths
// to `.html`, but relying on that is a host-specific bet with nothing to gain.
export const trailingSlash = 'always';
