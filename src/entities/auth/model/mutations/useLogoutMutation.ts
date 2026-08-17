import { authApi } from "@/src/entities/auth/api/authApi";
import { useMutation } from "@tanstack/react-query";

export const useLogoutMutation = () => {
  return useMutation({
    mutationFn: (refreshToken: string) => authApi.logout(refreshToken),
  });
};
