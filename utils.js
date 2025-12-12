const routes = {
  Home: "/",
  CookProfiles: "/cooks",
  CookProfile: "/cook",
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
