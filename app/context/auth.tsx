import {
    AuthError,
    AuthRequestConfig,
    DiscoveryDocument,
    makeRedirectUri,
    useAuthRequest,
} from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import React from "react";
import { Platform } from "react-native";
import { BASE_URL } from "../../constants";

WebBrowser.maybeCompleteAuthSession();

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  picture?: string;
  given_name?: string;
  family_name?: string;
  email_verified?: boolean;
  provider?: string;
  exp: number;
  cookieExpiresAt: number;
};

const config: AuthRequestConfig = {
  clientId: "google",
  scopes: ["openid", "profile", "email"],
  redirectUri: makeRedirectUri(),
};

const discovery: DiscoveryDocument = {
  authorizationEndpoint: `${BASE_URL}/api/auth/authorize`,
  tokenEndpoint: `${BASE_URL}/api/auth/token`,
};

const authContext = React.createContext({
  user: null as AuthUser | null,
  signIn: () => {},
  signOut: () => {},
  fetchWithAuth: async (input: RequestInfo, init?: RequestInit) => {
    return fetch(input, init);
  },
  isLoading: false,
  error: null as AuthError | null,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = React.useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<AuthError | null>(null);

  const [request, response, promptAsync] = useAuthRequest(config, discovery);
  const isWeb = Platform.OS === "web";

  React.useEffect(() => {
    if (response) {
      handleResponse(response);
    }
  }, [response]);

  const handleResponse = async (response: any) => {
    if (response.type === "success") {
      const { code } = response.params;
      console.log("code", code);

      try {
        setIsLoading(true);
        const formData = new FormData();

        if (isWeb) {
          formData.append("code", code);
        }
        const tokenReponse = await fetch(`${BASE_URL}/api/auth/token`, {
          method: "POST",
          body: formData,
          credentials: isWeb ? "include" : "same-origin",
        });

        if (!tokenReponse.ok) {
          throw new Error("Failed to exchange token");
        }

        const tokenData = await tokenReponse.json();
        setUser(tokenData.user);
        console.log("User logged in:", tokenData.user);
      } catch (err) {
        console.error("Token exchange error:", err);
        setError(err as AuthError);
      } finally {
        setIsLoading(false);
      }
    } else if (response.type === "error") {
      setError(response.error);
    }
  };

  const signIn = async () => {
    try {
      setIsLoading(true);
      setError(null);
      if (!request) {
        throw new Error("Auth request is not ready");
      }
      await promptAsync();
    } catch (e) {
      console.error("SignIn error", e);
      setIsLoading(false);
    }
  };
  const signOut = async () => {
    setUser(null);
    setError(null);
    console.log("User signed out");
  };
  const fetchWithAuth = async (input: RequestInfo, init?: RequestInit) => {
    return fetch(input, init);
  };
  return (
    <authContext.Provider
      value={{
        user,
        signIn,
        signOut,
        fetchWithAuth,
        isLoading,
        error,
      }}
    >
      {children}
    </authContext.Provider>
  );
};

export const useAuth = () => React.useContext(authContext);
if (!React.useContext) {
  throw new Error("useAuth must be used within an AuthProvider");
}
