export interface RestaurantProvisioningProfile {
  name: string;
  email: string | null;
  document: string | null;
  phoneNumber: string | null;
  address: string | null;
  addressNumber: string | null;
  complement: string | null;
  province: string | null;
  postalCode: string | null;
  companyType: string | null;
  birthDate: Date | null;
}

export const normalizeDigits = (value: string | null | undefined): string => (value ?? "").replace(/\D/g, "");

export const isCompanyDocument = (document: string | null | undefined): boolean =>
  normalizeDigits(document).length === 14;

export const getMissingProvisioningFields = (
  profile: RestaurantProvisioningProfile
): string[] => {
  const missing: string[] = [];
  const documentDigits = normalizeDigits(profile.document);
  const companyDocument = documentDigits.length === 14;

  if (!profile.name.trim()) missing.push("name");
  if (!profile.email?.trim()) missing.push("email");
  if (![11, 14].includes(documentDigits.length)) missing.push("document");
  if (!profile.phoneNumber?.trim()) missing.push("phoneNumber");
  if (!profile.address?.trim()) missing.push("address");
  if (!profile.addressNumber?.trim()) missing.push("addressNumber");
  if (!profile.province?.trim()) missing.push("province");
  if (!profile.postalCode?.trim()) missing.push("postalCode");

  if (companyDocument) {
    if (!profile.companyType?.trim()) missing.push("companyType");
  } else if (!profile.birthDate) {
    missing.push("birthDate");
  }

  return missing;
};
