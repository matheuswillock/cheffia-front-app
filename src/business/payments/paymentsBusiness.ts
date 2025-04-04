import { createIntent, createProduct } from "@/api/payment";
import { OutputCreateIntent } from "@/models/dtos/output/OutputCreateIntent";

// TODO: implement the INPUTS and OUTPUTS for this function
export const handleCreatePaymentIntent = async () : Promise<OutputCreateIntent> => {
  try {
    console.log('Creating intent...');
    const response = await createIntent();

    if (!response.isValid) 
      throw new Error('Erro ao criar intent de pagamento');

    return OutputCreateIntent.fromOutputResult(response);
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw error;
    // TODO: Redirect to error page;
    // redirect('/error');
  }
}