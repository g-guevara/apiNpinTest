import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import PinMenu, { PinMenuItem } from "./copmonents/PinMenu";
import { Transaction, transactionData } from "./data/sampleData";

export default function HomeScreen() {
  const router = useRouter();
  
  // State for PinMenu
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  // Menu items
  const menuItems: PinMenuItem[] = [
    {
      id: "cancel",
      name: "Cancel",
      icon: "close-circle",
      color: "#ffffff"
    },
    {
      id: "share",
      name: "Share",
      icon: "share-social",
      color: "#ffffff"
    },
    {
      id: "more",
      name: "More",
      icon: "ellipsis-horizontal",
      color: "#ffffff"
    }
  ];

  // Navigate to details screen with transaction data
  const handleTransactionPress = (transaction: Transaction) => {
    router.push({
      pathname: "/details",
      params: { transactionId: transaction.id.toString() }
    });
  };

  // Handle long press to show context menu
  const handleTransactionLongPress = (transaction: Transaction, event: any) => {
    // Get touch position
    const { pageX, pageY } = event.nativeEvent;
    
    // Show menu at touch position
    setMenuPosition({ x: pageX, y: pageY });
    setSelectedTransaction(transaction);
    setMenuVisible(true);
  };

  // Handle menu item selection
  const handleMenuSelect = (item: PinMenuItem) => {
    if (!selectedTransaction) return;

    switch (item.id) {
      case "share":
        Alert.alert("Share", `Sharing transaction: ${selectedTransaction.name}`);
        break;
      case "more":
        Alert.alert("More Options", `More options for: ${selectedTransaction.name}`, [
          { text: "Edit", onPress: () => Alert.alert("Edit", "Edit functionality would go here") },
          { text: "Delete", onPress: () => Alert.alert("Delete", "Delete functionality would go here") },
          { text: "Cancel", style: "cancel" }
        ]);
        break;
      case "cancel":
      default:
        // Just close the menu
        break;
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return "$" + amount.toFixed(2);
  };

  // Render each transaction item
  const renderItem = ({ item }: { item: Transaction }) => {
    return (
      <TouchableOpacity
        style={styles.transactionCard}
        onPress={() => handleTransactionPress(item)}
        onLongPress={(event) => handleTransactionLongPress(item, event)}
        delayLongPress={300} // Reduced from 500 to 300 milliseconds
      >
        <View style={styles.leftContent}>
          <Text style={styles.transactionName}>{item.name}</Text>
          <Text style={styles.transactionCategory}>{item.category}</Text>
          <Text style={styles.transactionDate}>{item.date}</Text>
        </View>
        <View style={styles.rightContent}>
          <Text style={styles.transactionAmount}>
            {formatCurrency(item.mount)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  // Calculate total amount of all transactions
  const totalAmount = transactionData.reduce((sum, item) => sum + item.mount, 0);

  return (
    <View style={styles.container}>
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Total Transactions</Text>
        <Text style={styles.summaryAmount}>{formatCurrency(totalAmount)}</Text>
        <Text style={styles.summaryCount}>{transactionData.length} transactions</Text>
      </View>
      
      <FlatList
        data={transactionData}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
      />

      {/* Pin Menu */}
      <PinMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        onSelect={handleMenuSelect}
        menuItems={menuItems}
        position={menuPosition}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  summaryCard: {
    backgroundColor: "#3498db",
    padding: 20,
    margin: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
    marginBottom: 8,
  },
  summaryAmount: {
    fontSize: 32,
    fontWeight: "700",
    color: "white",
    marginBottom: 4,
  },
  summaryCount: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  transactionCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  leftContent: {
    flex: 1,
  },
  rightContent: {
    justifyContent: "center",
    alignItems: "flex-end",
  },
  transactionName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  transactionCategory: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
    color: "#888",
  },
  transactionAmount: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2ecc71",
  },
});