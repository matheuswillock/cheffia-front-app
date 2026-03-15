interface ViaCepResponse {
  cep?: string;
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  erro?: boolean;
}

export interface PostalCodeAddress {
  postalCode: string;
  street: string;
  province: string;
  city: string;
  state: string;
  country: string;
}

const BRAZIL_COUNTRY = "Brasil";

export function formatPostalCode(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 5) {
    return digits;
  }

  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

export async function fetchAddressByPostalCode(
  postalCode: string
): Promise<PostalCodeAddress | null> {
  const sanitizedPostalCode = postalCode.replace(/\D/g, "");

  if (sanitizedPostalCode.length !== 8) {
    return null;
  }

  try {
    const response = await fetch(`https://viacep.com.br/ws/${sanitizedPostalCode}/json/`, {
      method: "GET",
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as ViaCepResponse;

    if (payload.erro) {
      return null;
    }

    return {
      postalCode: formatPostalCode(sanitizedPostalCode),
      street: payload.logradouro?.trim() ?? "",
      province: payload.bairro?.trim() ?? "",
      city: payload.localidade?.trim() ?? "",
      state: payload.uf?.trim().toUpperCase() ?? "",
      country: BRAZIL_COUNTRY,
    };
  } catch (error) {
    console.error("Failed to fetch postal code address:", error);
    return null;
  }
}
