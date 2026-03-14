import { cheffiaApiConfig } from '@/lib/api/config/cheffiaApiConfig';
import { Output } from '@/models/Output';
import { restaurantRoutes } from '@/lib/api/routes/routesConfig';
import { InputToRegisterRestaurant } from '@/models/dtos/input/InputToRegisterRestaurant';

export const registerRestaurant = async (data: InputToRegisterRestaurant): Promise<Output> => {
  try {
    const response = await cheffiaApiConfig.post(
      restaurantRoutes.registerRestaurant,
      data,
    );

    return response.data;
  } catch (error) {
    console.error('Error registering restaurant:', error);
    throw error;
  }
};

export const getRestaurantById = async (id: string): Promise<Output> => {
  try {
    const response = await cheffiaApiConfig.get(restaurantRoutes.getRestaurant(id));
    return Output.fromOutputResult(response.data);
  } catch (error: any) {
    if (error.isAxiosError && error.response?.status === 400) {
      return new Output(false, [], [error.message], error);
    }
    throw error;
  }
};

export const getRestaurantFinancialAccount = async (
  restaurantId: string
): Promise<Output> => {
  try {
    const response = await cheffiaApiConfig.get(
      restaurantRoutes.getRestaurantFinancialAccount(restaurantId)
    );

    return Output.fromOutputResult(response.data);
  } catch (error: any) {
    if (error.isAxiosError && error.response?.status === 400) {
      return new Output(
        false,
        [],
        error.response?.data?.errorMessages ?? [error.message],
        error.response?.data?.result ?? null
      );
    }

    throw error;
  }
};

export const getRestaurantFinancialSummary = async (
  restaurantId: string
): Promise<Output> => {
  try {
    const response = await cheffiaApiConfig.get(
      restaurantRoutes.getRestaurantFinancialSummary(restaurantId)
    );

    return Output.fromOutputResult(response.data);
  } catch (error: any) {
    if (error.isAxiosError && error.response?.status === 400) {
      return new Output(
        false,
        [],
        error.response?.data?.errorMessages ?? [error.message],
        error.response?.data?.result ?? null
      );
    }

    throw error;
  }
};

export const getRestaurantFinancialDocuments = async (
  restaurantId: string
): Promise<Output> => {
  try {
    const response = await cheffiaApiConfig.get(
      restaurantRoutes.getRestaurantFinancialDocuments(restaurantId)
    );

    return Output.fromOutputResult(response.data);
  } catch (error: any) {
    if (error.isAxiosError && error.response?.status === 400) {
      return new Output(
        false,
        [],
        error.response?.data?.errorMessages ?? [error.message],
        error.response?.data?.result ?? null
      );
    }

    throw error;
  }
};

export const syncRestaurantFinancialDocuments = async (
  restaurantId: string
): Promise<Output> => {
  try {
    const response = await cheffiaApiConfig.post(
      restaurantRoutes.syncRestaurantFinancialDocuments(restaurantId),
      {}
    );

    return Output.fromOutputResult(response.data);
  } catch (error: any) {
    if (error.isAxiosError && error.response?.status === 400) {
      return new Output(
        false,
        [],
        error.response?.data?.errorMessages ?? [error.message],
        error.response?.data?.result ?? null
      );
    }

    throw error;
  }
};

export const uploadRestaurantFinancialDocument = async (
  restaurantId: string,
  documentId: string,
  file: File
): Promise<Output> => {
  try {
    const formData = new FormData();
    formData.append("documentFile", file);

    const response = await cheffiaApiConfig.post(
      restaurantRoutes.uploadRestaurantFinancialDocument(restaurantId, documentId),
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return Output.fromOutputResult(response.data);
  } catch (error: any) {
    if (error.isAxiosError && error.response?.status === 400) {
      return new Output(
        false,
        [],
        error.response?.data?.errorMessages ?? [error.message],
        error.response?.data?.result ?? null
      );
    }

    throw error;
  }
};
