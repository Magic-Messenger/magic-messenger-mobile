import { defineConfig } from "orval";

export default defineConfig({
  api: {
    input: {
      target: "https://dev-new-api.magicmessenger.app/swagger/v1/swagger.json",
      validation: false,
    },
    output: {
      mode: "single",
      target: "./api/endpoints",
      schemas: "./api/models",
      client: "react-query",
      httpClient: "axios",
      prettier: true,
      tsconfig: "./tsconfig.json",
      override: {
        mutator: {
          path: "./services/axios/AxiosBase.ts",
          name: "AxiosInstance",
        },
        query: {
          useQuery: true,
          useMutation: true,
          options: {
            staleTime: 10000,
            refetchOnWindowFocus: false,
          },
        },
      },
    },
    hooks: {
      afterAllFilesWrite: "prettier --write",
    },
  },
});
