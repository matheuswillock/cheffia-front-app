import { InputItem, InputToAddMenuItem } from "@/models/dtos/InputToAddMenuItem";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const AddMenuItemToMenu = async (input: InputItem, media: File , restaurantId: string) => {
  try {
    const formData = new FormData();
    formData.append('Item.Name', input.name);
    formData.append('Item.Description', input.description);
    formData.append('Item.Price', input.price.toString());
    formData.append('Item.Ingredients', JSON.stringify(input.ingredients));
    formData.append('Item.ItemMedia', media);
    formData.append('RestaurantId', restaurantId);

    console.log('formData:', formData);
    const response = await axios.post(`${API_URL}/api/v1/menus/items/add`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'accept': '*/*'
      }
    });
    console.log(response);
    return response.data;
  } catch (error) {
    console.error('Error adding item to menu:', error);
    throw error;
  }
};



// export const AddMenuItemToMenu = async (item: InputItem, restaurantId: string, itemMedia: File) => {
//   const formData = new FormData();
//   formData.append('Item.Name', item.name);
//   formData.append('Item.Description', item.description);
//   formData.append('Item.Price', item.price.toString());
//   formData.append('Item.Ingredients', JSON.stringify(item.ingredients));
//   if (itemMedia) {
//     formData.append('Item.ItemMedia', itemMedia);
//   }
//   formData.append('RestaurantId', restaurantId);

//   try {
//     const response = await axios.post(`${API_URL}/api/v1/menus/items/add`, formData, {
//       headers: {
//         'Content-Type': 'multipart/form-data',
//         'accept': '*/*'
//       }
//     });
//     console.log(response);
//     return response.data;
//   } catch (error) {
//     console.error('Error adding item to menu:', error);
//     throw error;
//   }
// };
