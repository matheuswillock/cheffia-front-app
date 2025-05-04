const sendAskUrl = process.env.NEXT_PUBLIC_DISCORD_WEBHOOK_CHEFFIA_ASK as string;
const waitlistUrl = process.env.NEXT_PUBLIC_DISCORD_WEBHOOK_CHEFFIA_WAITLIST as string;

export const restaurantRoutes = {
  registerRestaurant: '/Restaurant/register',
  getRestaurant: (id: string) => `/Restaurant/${id}`
}

export const paymentRoutes = {
  createItent: '/Payment/intent/create',
  createProduct: '/Payment/product/create'
}

export const MenuRoutes = {
  add: '/Menu/items/add',
  allMenuItems: '/Menu/get',
  deleteItem: '/Menu/items/delete'
};

export const CheffiaDiscordRoutes = {
  sendAsk: sendAskUrl,
  insertClientOnWaitlist: waitlistUrl
}