import axios from 'axios';

const API_URL = 'https://api.example.com/restaurants';

export const registerRestaurant = async (data: any) => {
  try {
    const response = await axios.post(API_URL, data);
    return response.data;
  } catch (error) {
    console.error('Error registering restaurant:', error);
    throw error;
  }
};