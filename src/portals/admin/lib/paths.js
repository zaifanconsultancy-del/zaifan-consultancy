// The same pages serve the admin (/admin) and the counselor (/counselor)
// portals. Whichever portal is open sets the base once; pages build links with
// path("/people/123") so they never hard-code the portal.

let base = "/admin";

export function setPortalBase(next) {
  base = next;
}

export function path(sub = "") {
  return `${base}${sub}`;
}
