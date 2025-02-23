import { InputToRegisterRestaurant } from '@/models/dtos/InputToRegisterRestaurant';
import { Output } from '@/models/Output';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const registerRestaurant = async (data: InputToRegisterRestaurant): Promise<Output> => {
  try {
    const response = await axios.post(`${API_URL}/api/v1/restaurants/register`, data, {
      headers: {
        'Access-Control-Allow-Origin': '*'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error registering restaurant:', error);
    throw error;
  }
};

export const getRestaurantById = async (id: string): Promise<Output> => {
  try {
    const response = await axios.get(`${API_URL}/api/v1/restaurants/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error getting restaurant:', error);
    throw error;
  }
};