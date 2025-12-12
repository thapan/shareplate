const routes = {
  Home: "/",
  CookProfiles: "/cooks",
  CookProfile: "/cooks/:id",
  Messages: "/messages",
  MyMeals: "/my-meals",
  Login: "/login",
  Signup: "/signup",
  Policies: "/policies",
  Admin: "/admin",
};

export function createPageUrl(name) {
  return routes[name] || "/";
}

export function createCookProfileUrl(idOrSlug = "") {
  if (!idOrSlug) return routes.CookProfiles;
  return `/cooks/${encodeURIComponent(idOrSlug)}`;
}
