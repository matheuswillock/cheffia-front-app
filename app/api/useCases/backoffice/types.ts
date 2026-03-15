export type BackofficeRole = "admin" | "operator";

export type BackofficeRestaurantStatus = "active" | "inactive" | "cancelled";

export type BackofficeMetricsPeriod = "7d" | "30d" | "6m";

export interface BackofficeUserOutput {
  id: string;
  supabaseUserId: string;
  email: string;
  fullName: string;
  jobTitle: string | null;
  department: string | null;
  role: BackofficeRole;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBackofficeUserInput {
  email: string;
  fullName: string;
  password: string;
  jobTitle: string;
  department: string;
  role: BackofficeRole;
}

export interface UpdateBackofficeUserInput {
  fullName?: string;
  jobTitle?: string;
  department?: string;
  role?: BackofficeRole;
  isActive?: boolean;
}

export interface BackofficeRestaurantSummary {
  id: string;
  tenantId: string;
  tenantName: string;
  supabaseUserId: string | null;
  name: string;
  ownerFullName: string;
  email: string;
  phoneNumber: string;
  lifecycleStatus: BackofficeRestaurantStatus;
  registerDate: string;
  totalOrders: number;
  financialStatus: string | null;
}

export interface BackofficeRestaurantDetail extends BackofficeRestaurantSummary {
  address: string;
  addressNumber: string;
  complement: string;
  province: string;
  postalCode: string;
  document: string;
  companyType: string | null;
  personType: string;
  emailVerified: boolean;
  lifecycleStatusChangedAt: string | null;
  financialOnboardingStartedAt: string | null;
  financialOnboardingCompletedAt: string | null;
  latestFinancialAccountId: string | null;
}

export interface UpdateBackofficeRestaurantInput {
  name?: string;
  ownerFullName?: string;
  email?: string;
  phoneNumber?: string;
  address?: string;
  addressNumber?: string;
  complement?: string;
  province?: string;
  postalCode?: string;
  lifecycleStatus?: BackofficeRestaurantStatus;
}

export interface BackofficeMenuItemInput {
  name: string;
  description: string;
  price: number;
  ingredients: string[];
  categoryId?: string | null;
}

export interface BackofficeOrdersByRestaurant {
  restaurantId: string;
  restaurantName: string;
  totalOrders: number;
}

export interface BackofficeDashboardMetricsOutput {
  period: BackofficeMetricsPeriod;
  startDate: string;
  endDate: string;
  newClients: number;
  clientsExited: number;
  totalOrders: number;
  ordersByRestaurant: BackofficeOrdersByRestaurant[];
}

