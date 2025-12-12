// Simple in-memory mock API to replace the Base44 client.
// This keeps the UI functional without any external services.
const nowIso = () => new Date().toISOString();
const uid = (prefix) => `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
const clone = (data) => JSON.parse(JSON.stringify(data));
const matches = (item, criteria = {}) =>
  Object.entries(criteria).every(([key, value]) => item[key] === value);
const sortBy = (arr, sort) => {
  if (sort === "-created_date") {
    return [...arr].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
  }
  if (sort === "created_date") {
    return [...arr].sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
  }
  return [...arr];
};

const seedUsers = [
  { id: "user_demo", email: "demo@foodshare.com", full_name: "Demo User", bio: "Home cook sharing favorites." },
  { id: "user_maria", email: "maria@foodshare.com", full_name: "Maria Rossi", bio: "Italian classics with love." },
  { id: "user_lee", email: "lee@foodshare.com", full_name: "Lee Chen", bio: "Family recipes and comfort bowls." },
];

const seedMeals = [
  {
    id: "meal_paella",
    title: "Sunshine Veggie Paella",
    description: "Saffron rice with roasted peppers, artichokes, and chickpeas—bright, hearty, and sharable.",
    image_url: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200",
    date: new Date().toISOString().split("T")[0],
    time: "6:00 PM",
    portions_available: 6,
    portions_claimed: 2,
    cuisine_type: "mediterranean",
    dietary_info: ["vegetarian"],
    location: "Downtown",
    lat: 37.7749,
    lng: -122.4194,
    cook_name: "Maria Rossi",
    created_by: "maria@foodshare.com",
    status: "open",
    created_date: nowIso(),
  },
  {
    id: "meal_ramen",
    title: "Slow-Simmered Shoyu Ramen",
    description: "House broth, marinated egg, bamboo shoots, and chashu. Slurp-worthy.",
    image_url: "https://images.unsplash.com/photo-1604908177683-2ba522bd87c2?w=1200",
    date: new Date(Date.now() + 86400000).toISOString().split("T")[0],
    time: "7:00 PM",
    portions_available: 8,
    portions_claimed: 5,
    cuisine_type: "japanese",
    dietary_info: [],
    location: "Midtown",
    lat: 37.8044,
    lng: -122.2711,
    cook_name: "Lee Chen",
    created_by: "lee@foodshare.com",
    status: "open",
    created_date: nowIso(),
  },
];

const seedReviews = [
  {
    id: "review_1",
    meal_id: "meal_paella",
    meal_title: "Sunshine Veggie Paella",
    cook_email: "maria@foodshare.com",
    cook_name: "Maria Rossi",
    reviewer_email: "demo@foodshare.com",
    reviewer_name: "Demo User",
    rating: 5,
    review_text: "Absolutely delicious and comforting. Generous portions!",
    created_date: nowIso(),
  },
  {
    id: "review_2",
    meal_id: "meal_ramen",
    meal_title: "Slow-Simmered Shoyu Ramen",
    cook_email: "lee@foodshare.com",
    cook_name: "Lee Chen",
    reviewer_email: "demo@foodshare.com",
    reviewer_name: "Demo User",
    rating: 4,
    review_text: "Great broth and toppings. Loved the egg!",
    created_date: nowIso(),
  },
];

const seedMessages = [
  {
    id: "msg_1",
    sender_email: "demo@foodshare.com",
    sender_name: "Demo User",
    receiver_email: "maria@foodshare.com",
    receiver_name: "Maria Rossi",
    content: "Hi Maria! Is the paella available for pickup at 6?",
    is_read: false,
    created_date: nowIso(),
  },
  {
    id: "msg_2",
    sender_email: "maria@foodshare.com",
    sender_name: "Maria Rossi",
    receiver_email: "demo@foodshare.com",
    receiver_name: "Demo User",
    content: "Yes! I can have it ready by then.",
    is_read: false,
    created_date: nowIso(),
  },
];

let users = [...seedUsers];
let meals = [...seedMeals];
let reviews = [...seedReviews];
let messages = [...seedMessages];
let mealRequests = [];

const mockApi = {
  entities: {
    Meal: {
      list: async (sort = "-created_date", limit = 1000) =>
        sortBy(meals, sort).slice(0, limit).map(clone),
      filter: async (criteria = {}, sort = "-created_date") =>
        sortBy(meals.filter((m) => matches(m, criteria)), sort).map(clone),
      create: async (data) => {
        const record = { id: uid("meal"), created_date: nowIso(), ...data };
        meals.push(record);
        return clone(record);
      },
      update: async (id, updates) => {
        const idx = meals.findIndex((m) => m.id === id);
        if (idx === -1) throw new Error("Meal not found");
        meals[idx] = { ...meals[idx], ...updates };
        return clone(meals[idx]);
      },
    },
    MealRequest: {
      create: async (data) => {
        const record = { id: uid("req"), created_date: nowIso(), ...data };
        mealRequests.push(record);
        return clone(record);
      },
      list: async () => mealRequests.map(clone),
    },
    Review: {
      list: async (sort = "-created_date", limit = 1000) =>
        sortBy(reviews, sort).slice(0, limit).map(clone),
      filter: async (criteria = {}, sort = "-created_date") =>
        sortBy(reviews.filter((r) => matches(r, criteria)), sort).map(clone),
      create: async (data) => {
        const record = { id: uid("rev"), created_date: nowIso(), ...data };
        reviews.push(record);
        return clone(record);
      },
    },
    Message: {
      list: async (sort = "-created_date") => sortBy(messages, sort).map(clone),
      filter: async (criteria = {}, sort = "-created_date") =>
        sortBy(messages.filter((m) => matches(m, criteria)), sort).map(clone),
      create: async (data) => {
        const record = { id: uid("msg"), created_date: nowIso(), ...data };
        messages.push(record);
        return clone(record);
      },
      update: async (id, updates) => {
        const idx = messages.findIndex((m) => m.id === id);
        if (idx === -1) throw new Error("Message not found");
        messages[idx] = { ...messages[idx], ...updates };
        return clone(messages[idx]);
      },
    },
    User: {
      list: async () => users.map(clone),
      filter: async (criteria = {}) => users.filter((u) => matches(u, criteria)).map(clone),
    },
  },
  integrations: {
    Core: {
      UploadFile: async () => ({
        file_url: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200",
      }),
    },
  },
};

export { mockApi };
