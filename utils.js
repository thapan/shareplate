const routes = {
  Home: "/",
  CookProfiles: "/cooks",
  CookProfile: "/cook",
  Messages: "/messages",
  MyMeals: "/my-meals",
  Login: "/login",
};

export function createPageUrl(name) {
  return routes[name] || "/";
}
