import { authApi } from "@/src/entities/auth/api/authApi";
import { useMutation } from "@tanstack/react-query";

export const useGoogleLoginMutation = () => {
  return useMutation({
    mutationFn: (idToken: string) => authApi.googleLogin(idToken),
  });
};
