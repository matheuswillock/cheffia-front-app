const sendAskUrl = process.env.NEXT_PUBLIC_DISCORD_WEBHOOK_CHEFFIA_ASK as string;
const waitlistUrl = process.env.NEXT_PUBLIC_DISCORD_WEBHOOK_CHEFFIA_WAITLIST as string;

export const restaurantRoutes = {
  registerRestaurant: '/Restaurant/register',
  getRestaurant: (id: string) => `/Restaurant/${id}`,
  getRestaurantFinancialAccount: (restaurantId: string) =>
    `/Restaurant/${restaurantId}/financial-account`,
  getRestaurantFinancialDocuments: (restaurantId: string) =>
    `/Restaurant/${restaurantId}/financial-account/documents`,
  syncRestaurantFinancialDocuments: (restaurantId: string) =>
    `/Restaurant/${restaurantId}/financial-account/documents/sync`,
  uploadRestaurantFinancialDocument: (restaurantId: string, documentId: string) =>
    `/Restaurant/${restaurantId}/financial-account/documents/${documentId}/upload`,
  confirmEmail: '/Restaurant/confirm-email',
  deleteRestaurant: (restaurantId: string) => `/Restaurant/${restaurantId}/delete`,
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
