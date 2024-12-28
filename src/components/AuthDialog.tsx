import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { AuthForm } from "./Auth/AuthForm";
import { SignUpContent } from "./Auth/SignUpContent";
import { createUserWithMetadata, checkProfileCompletion } from "@/utils/auth";
import { z } from "zod";

const authSchema = z.object({
  identifier: z.string().min(1, "Required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const AuthDialog = ({
  isOpen,
  onClose,
  defaultToSignUp = false,
}: {
  isOpen: boolean;
  onClose: () => void;
  defaultToSignUp?: boolean;
}) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(defaultToSignUp);
  const [authMethod, setAuthMethod] = useState<"email" | "phone">("email");

  const onSubmit = async (values: z.infer<typeof authSchema>) => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      const { identifier, password } = values;
      
      if (isSignUp) {
        const { user } = await createUserWithMetadata(identifier, password, authMethod === "email");
        
        if (user) {
          // Redirect to profile completion if profile is not complete
          const isProfileComplete = await checkProfileCompletion(user.id);
          if (!isProfileComplete) {
            navigate("/complete-profile");
          }
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword(
          authMethod === "email" 
            ? { email: identifier, password }
            : { phone: identifier, password }
        );
        if (error) throw error;
      }

      toast({
        title: isSignUp ? "Account created!" : "Welcome back!",
        description: isSignUp 
          ? "Please check your email for verification." 
          : "You've successfully signed in.",
      });
      
      onClose();
    } catch (error: any) {
      console.error("Auth error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "An error occurred during authentication",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[872px] p-0 gap-0">
        <div className="grid sm:grid-cols-2">
          <div className="p-6 bg-gradient-to-tl from-brand-orange via-brand-orange to-gray-100/20">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-center text-white">
                {isSignUp ? "Create your account" : "Welcome back"}
              </DialogTitle>
            </DialogHeader>

            <Tabs value={authMethod} onValueChange={(value) => setAuthMethod(value as "email" | "phone")} className="mt-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="email">Email</TabsTrigger>
                <TabsTrigger value="phone">Phone</TabsTrigger>
              </TabsList>

              <AuthForm
                isSignUp={isSignUp}
                authMethod={authMethod}
                isLoading={isLoading}
                onSubmit={onSubmit}
              />
            </Tabs>

            <Button
              type="button"
              variant="ghost"
              className="w-full mt-4 text-white hover:text-white/90 hover:bg-white/10"
              onClick={() => setIsSignUp(!isSignUp)}
              disabled={isLoading}
            >
              {isSignUp
                ? "Already have an account? Sign in"
                : "Don't have an account? Sign up"}
            </Button>
          </div>

          {isSignUp && (
            <div className="border-l">
              <SignUpContent />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};