export const USER_PROFILE_ROLES = ["master", "admin", "operator"] as const;

export type UserProfileRole = (typeof USER_PROFILE_ROLES)[number];
