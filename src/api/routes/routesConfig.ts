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