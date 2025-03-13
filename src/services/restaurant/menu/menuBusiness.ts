import { InputToAddMenuItem } from "@/models/dtos/InputToAddMenuItem";
import { MenuItem } from "@/models/menuModels/MenuItem";
import { Output } from "@/models/Output";
import { AddMenuItemToMenu, DeleteMenuItem, GetAllMenuItems } from "@/api/menuService";
import { AddMenuItemData } from "@/types/formTypes";
import { MenuCategory, MenuItem as MenuItemMock } from "@/models/menuModels/mockedModels";
import Placeholder from "@/assets/placeholder.svg";

// TODO: Remover o mock e implementar a chamada para a API
// Mock data for menu categories
const categories: MenuCategory[] = [
  { id: "appetizers", name: "Appetizers" },
  { id: "mains", name: "Main Courses" },
  { id: "sides", name: "Sides" },
  { id: "desserts", name: "Desserts" },
  { id: "drinks", name: "Drinks" },
]

// Mock data for menu items
const menuItems: Record<string, MenuItemMock[]> = {
  appetizers: [
    {
      id: "app1",
      name: "Garlic Bread",
      description: "Freshly baked bread with garlic butter and herbs",
      price: 5.99,
      // image: "../../../assets/placeholder.svg?height=400&width=600",
      dietary: ["Vegetarian"],
      options: [
        {
          name: "Add Cheese",
          required: false,
          multiple: false,
          choices: [
            { id: "no-cheese", name: "No Cheese", price: 0 },
            { id: "mozzarella", name: "Mozzarella", price: 1.5 },
            { id: "parmesan", name: "Parmesan", price: 1.5 },
          ],
        },
      ],
    },
    {
      id: "app2",
      name: "Chicken Wings",
      description: "Crispy chicken wings tossed in your choice of sauce",
      price: 12.99,
      // image: "../../../assets/placeholder.svg?height=400&width=600",
      options: [
        {
          name: "Sauce",
          required: true,
          multiple: false,
          choices: [
            { id: "buffalo", name: "Buffalo", price: 0 },
            { id: "bbq", name: "BBQ", price: 0 },
            { id: "honey-garlic", name: "Honey Garlic", price: 0 },
            { id: "lemon-pepper", name: "Lemon Pepper", price: 0 },
          ],
        },
        {
          name: "Dipping Sauce",
          required: false,
          multiple: true,
          choices: [
            { id: "ranch", name: "Ranch", price: 0.75 },
            { id: "blue-cheese", name: "Blue Cheese", price: 0.75 },
            { id: "honey-mustard", name: "Honey Mustard", price: 0.75 },
          ],
        },
      ],
    },
    {
      id: "app3",
      name: "Loaded Nachos",
      description: "Tortilla chips topped with cheese, jalapeños, guacamole, and sour cream",
      price: 10.99,
      // image: "../../../assets/placeholder.svg?height=400&width=600",
      dietary: ["Vegetarian"],
      options: [
        {
          name: "Add Protein",
          required: false,
          multiple: false,
          choices: [
            { id: "no-protein", name: "No Protein", price: 0 },
            { id: "chicken", name: "Grilled Chicken", price: 3.5 },
            { id: "beef", name: "Ground Beef", price: 3.5 },
          ],
        },
      ],
    },
  ],
  mains: [
    {
      id: "main1",
      name: "Classic Burger",
      description: "Juicy beef patty with lettuce, tomato, onion, and our special sauce on a brioche bun",
      price: 14.99,
      // image: "../../../assets/placeholder.svg?height=400&width=600",
      options: [
        {
          name: "Doneness",
          required: true,
          multiple: false,
          choices: [
            { id: "medium-rare", name: "Medium Rare", price: 0 },
            { id: "medium", name: "Medium", price: 0 },
            { id: "medium-well", name: "Medium Well", price: 0 },
            { id: "well-done", name: "Well Done", price: 0 },
          ],
        },
        {
          name: "Add Cheese",
          required: false,
          multiple: false,
          choices: [
            { id: "no-cheese", name: "No Cheese", price: 0 },
            { id: "american", name: "American", price: 1.5 },
            { id: "cheddar", name: "Cheddar", price: 1.5 },
            { id: "swiss", name: "Swiss", price: 1.5 },
          ],
        },
        {
          name: "Add Toppings",
          required: false,
          multiple: true,
          choices: [
            { id: "bacon", name: "Bacon", price: 2 },
            { id: "avocado", name: "Avocado", price: 1.5 },
            { id: "fried-egg", name: "Fried Egg", price: 1.5 },
            { id: "mushrooms", name: "Sautéed Mushrooms", price: 1 },
          ],
        },
      ],
    },
    {
      id: "main2",
      name: "Margherita Pizza",
      description: "Classic pizza with tomato sauce, fresh mozzarella, and basil",
      price: 16.99,
      image: "../../assets/placeholder.svg?height=400&width=600",
      dietary: ["Vegetarian"],
      options: [
        {
          name: "Size",
          required: true,
          multiple: false,
          choices: [
            { id: "medium", name: 'Medium (12")', price: 0 },
            { id: "large", name: 'Large (16")', price: 4 },
          ],
        },
        {
          name: "Crust",
          required: true,
          multiple: false,
          choices: [
            { id: "thin", name: "Thin Crust", price: 0 },
            { id: "regular", name: "Regular Crust", price: 0 },
            { id: "thick", name: "Thick Crust", price: 1 },
          ],
        },
      ],
    },
  ],
  sides: [
    {
      id: "side1",
      name: "French Fries",
      description: "Crispy golden fries seasoned with sea salt",
      price: 4.99,
      image: "../../assets/placeholder.svg?height=400&width=600",
      dietary: ["Vegetarian", "Vegan"],
      options: [
        {
          name: "Size",
          required: true,
          multiple: false,
          choices: [
            { id: "regular", name: "Regular", price: 0 },
            { id: "large", name: "Large", price: 2 },
          ],
        },
      ],
    },
  ],
  desserts: [
    {
      id: "dessert1",
      name: "Chocolate Brownie",
      description: "Warm chocolate brownie served with vanilla ice cream and chocolate sauce",
      price: 7.99,
      image: "../../assets/placeholder.svg?height=400&width=600",
      dietary: ["Vegetarian"],
      options: [],
    },
  ],
  drinks: [
    {
      id: "drink1",
      name: "Soft Drink",
      description: "Your choice of soda",
      price: 2.99,
      image: "../../assets/placeholder.svg?height=400&width=600",
      dietary: ["Vegan"],
      options: [
        {
          name: "Type",
          required: true,
          multiple: false,
          choices: [
            { id: "cola", name: "Cola", price: 0 },
            { id: "lemon-lime", name: "Lemon Lime", price: 0 },
            { id: "orange", name: "Orange", price: 0 },
            { id: "root-beer", name: "Root Beer", price: 0 },
          ],
        },
        {
          name: "Size",
          required: true,
          multiple: false,
          choices: [
            { id: "small", name: "Small", price: 0 },
            { id: "medium", name: "Medium", price: 1 },
            { id: "large", name: "Large", price: 1.5 },
          ],
        },
      ],
    },
  ],
}

export const handleAddMenuItem = async (data: AddMenuItemData): Promise<Output> => {
  try {
    const input = InputToAddMenuItem.fromFormData(data);
    const response = await AddMenuItemToMenu(input.Item, input.Item.itemMedia, input.restaurantId);
    return response;
  } catch (error) {
    console.error('Error adding menu item:', error);
    throw error;
  }
}

export const handleGetAllMenuItems = async (restaurantId: string): Promise<MenuItem[]> => {
  try {
    const output = await GetAllMenuItems(restaurantId);
    
    if (output.isValid && output.result) {
      return output.result.items as MenuItem[];
    }    

    return [];
  } catch (error) {
    console.error('Error getting all menu items:', error);
    throw error;
  }
}

export const handleDeleteMenuItem = async (itemId: string): Promise<Output> => {
  try {
    const response = await DeleteMenuItem(itemId);
    return response;
  } catch (error) {
    console.error('Error deleting menu item:', error);
    throw error;
  }
}

// Simulate API calls with delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export async function getMenuCategories(): Promise<MenuCategory[]> {
  await delay(500) // Simulate network delay
  return categories
}

export async function getMenuItemsByCategory(categoryId: string): Promise<MenuItemMock[]> {
  await delay(800) // Simulate network delay
  return menuItems[categoryId] || []
}

export async function getMenuItem(itemId: string): Promise<MenuItemMock | null> {
  await delay(300) // Simulate network delay

  for (const category in menuItems) {
    const item = menuItems[category].find((item) => item.id === itemId)
    if (item) return item
  }

  return null
}