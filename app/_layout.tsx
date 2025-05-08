import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
  return (
    <>
      <StatusBar style="auto" />
      <Stack>
        <Stack.Screen 
          name="index" 
          options={{ 
            title: "Transactions", 
            headerLargeTitle: true,
          }} 
        />
        <Stack.Screen 
          name="details" 
          options={{ 
            title: "Transaction Details",
          }} 
        />
      </Stack>
    </>
  );
}