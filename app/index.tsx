import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { LoginForm } from "./components/LoginForm";
import { useAuth } from "./context/auth";

const index = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#f5f5f5",
        }}
      >
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  return <Redirect href="/home" />;
};

export default index;
