import { redirect } from "next/navigation";
import { createClient } from "./supabase/client";

/**
 * Redirects to a specified path with an encoded message as a query parameter.
 * @param {('error' | 'success')} type - The type of message, either 'error' or 'success'.
 * @param {string} path - The path to redirect to.
 * @param {string} message - The message to be encoded and added as a query parameter.
 * @returns {never} This function doesn't return as it triggers a redirect.
 */
export function encodedRedirect(
  type: "error" | "success",
  path: string,
  message: string,
) {
  return redirect(`${path}?${type}=${encodeURIComponent(message)}`);
}

export async function redirectToDashboard(id: string) {
  return redirect("/dashboard/" + id);
}

export async function checkUserSession() {
  const supabase = createClient();

  const {
    error,
    data: { user }
  } = await supabase.auth.getUser();

  if (error || !user) {
    return redirect("/sign-in");
  }

  return user;
}