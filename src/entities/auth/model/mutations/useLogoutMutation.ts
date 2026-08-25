import { authApi } from "@/src/entities/auth/api/authApi";
import { useMutation } from "@tanstack/react-query";

export const useLogoutMutation = () => {
  return useMutation({
    mutationFn: () => authApi.logout(),
  });
};
