import { supabase } from "@/integrations/supabase/client";

export const checkProfileCompletion = async (userId: string) => {
  try {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("first_name")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.error("Error checking profile completion:", error);
      return false;
    }

    return !!profile?.first_name;
  } catch (error) {
    console.error("Error in checkProfileCompletion:", error);
    return false;
  }
};

export const createUserWithMetadata = async (
  identifier: string, 
  password: string
) => {
  try {
    // Create the user with a temporary email format
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: `${identifier}@temporary.com`,
      password,
      options: {
        data: {
          username: identifier,
        }
      }
    });

    if (signUpError) {
      console.error("Signup error:", signUpError);
      throw signUpError;
    }
    
    if (!signUpData.user) {
      throw new Error("No user returned from sign up");
    }

    // Log success for debugging
    console.log("User created successfully:", signUpData.user.id);
    
    return { user: signUpData.user };
  } catch (error) {
    console.error("Error in createUserWithMetadata:", error);
    throw error;
  }
};