import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

interface Category {
  id: string;
  name: string;
  icon: IconName;
  type: "income" | "expense";
}

interface Account {
  id: string;
  name: string;
  type: "chequing" | "savings";
}

export interface TransactionData {
  id: number;
  merchant: string;
  amount: number;
  date: string;
  icon: IconName;
  accountId: string;
}

const categories: Category[] = [
  { id: "salary", name: "Salary", icon: "cash-outline", type: "income" },
  {
    id: "freelance",
    name: "Freelance",
    icon: "briefcase-outline",
    type: "income",
  },
  {
    id: "investment",
    name: "Investment",
    icon: "trending-up-outline",
    type: "income",
  },
  {
    id: "interest",
    name: "Interest",
    icon: "analytics-outline",
    type: "income",
  },
  { id: "gift", name: "Gift", icon: "gift-outline", type: "income" },
  { id: "food", name: "Food", icon: "restaurant-outline", type: "expense" },
  { id: "transport", name: "Transport", icon: "car-outline", type: "expense" },
  { id: "shopping", name: "Shopping", icon: "cart-outline", type: "expense" },
  {
    id: "bills",
    name: "Bills",
    icon: "document-text-outline",
    type: "expense",
  },
  {
    id: "entertainment",
    name: "Entertainment",
    icon: "film-outline",
    type: "expense",
  },
  { id: "health", name: "Health", icon: "medical-outline", type: "expense" },
];

const accounts: Account[] = [
  { id: "chequing", name: "Chequing Account", type: "chequing" },
  { id: "savings", name: "Savings Account", type: "savings" },
];

export default function EditTransactionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [transaction, setTransaction] = useState<TransactionData | null>(null);
  const [transactionType, setTransactionType] = useState<"income" | "expense">(
    "expense"
  );
  const [merchant, setMerchant] = useState("");
  const [amount, setAmount] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );
  const [selectedAccountId, setSelectedAccountId] =
    useState<string>("chequing");

  useEffect(() => {
    if (params.transaction) {
      try {
        const loadedTransaction = JSON.parse(
          params.transaction as string
        ) as TransactionData;
        setTransaction(loadedTransaction);

        // Set initial values from transaction
        setMerchant(loadedTransaction.merchant);
        setAmount(Math.abs(loadedTransaction.amount).toString());
        setTransactionType(
          loadedTransaction.amount >= 0 ? "income" : "expense"
        );
        setSelectedAccountId(loadedTransaction.accountId || "chequing");

        // Find matching category based on icon
        const matchingCategory = categories.find(
          (cat) =>
            cat.icon === loadedTransaction.icon &&
            cat.type === (loadedTransaction.amount >= 0 ? "income" : "expense")
        );

        if (matchingCategory) {
          setSelectedCategory(matchingCategory);
        }
      } catch (error) {
        console.error("Error parsing transaction:", error);
        Alert.alert("Error", "Could not load transaction details");
        router.back();
      }
    } else {
      // No transaction data provided
      Alert.alert("Error", "No transaction to edit");
      router.back();
    }
  }, [params.transaction]);

  const filteredCategories = categories.filter(
    (category) => category.type === transactionType
  );

  const handleSubmit = async () => {
    if (!transaction) return;

    if (!merchant.trim()) {
      Alert.alert("Error", "Please enter a name for the transaction");
      return;
    }

    if (!amount.trim() || isNaN(parseFloat(amount))) {
      Alert.alert("Error", "Please enter a valid amount");
      return;
    }

    if (!selectedCategory) {
      Alert.alert("Error", "Please select a category");
      return;
    }

    const updatedTransaction: TransactionData = {
      id: transaction.id,
      merchant: merchant.trim(),
      amount:
        transactionType === "expense"
          ? -Math.abs(parseFloat(amount))
          : Math.abs(parseFloat(amount)),
      date: transaction.date, // Keep the original date
      icon: selectedCategory.icon,
      accountId: selectedAccountId,
    };

    try {
      const existingTransactionsStr = await AsyncStorage.getItem(
        "transactions"
      );
      const existingTransactions = existingTransactionsStr
        ? JSON.parse(existingTransactionsStr)
        : [];

      // Replace the old transaction with the updated one
      const updatedTransactions = existingTransactions.map(
        (t: TransactionData) =>
          t.id === updatedTransaction.id ? updatedTransaction : t
      );

      await AsyncStorage.setItem(
        "transactions",
        JSON.stringify(updatedTransactions)
      );

      Alert.alert("Success", "Transaction updated successfully", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error("Error updating transaction:", error);

      Alert.alert("Error", "Could not update the transaction", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    }
  };

  if (!transaction) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading transaction...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.keyboardAvoid}
    >
      <Stack.Screen
        options={{
          title: "Edit Transaction",
          headerShown: true,
        }}
      />

      <ScrollView style={styles.scrollContainer}>
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              transactionType === "expense" ? styles.activeToggle : null,
            ]}
            onPress={() => setTransactionType("expense")}
          >
            <Text
              style={[
                styles.toggleText,
                transactionType === "expense" ? styles.activeToggleText : null,
              ]}
            >
              Expense
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              transactionType === "income" ? styles.activeToggle : null,
            ]}
            onPress={() => setTransactionType("income")}
          >
            <Text
              style={[
                styles.toggleText,
                transactionType === "income" ? styles.activeToggleText : null,
              ]}
            >
              Income
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Account</Text>
            <View style={styles.accountSelectorContainer}>
              {accounts.map((account) => (
                <TouchableOpacity
                  key={account.id}
                  style={[
                    styles.accountOption,
                    selectedAccountId === account.id
                      ? styles.selectedAccountOption
                      : null,
                  ]}
                  onPress={() => setSelectedAccountId(account.id)}
                >
                  <Ionicons
                    name={
                      account.type === "chequing"
                        ? "wallet-outline"
                        : "save-outline"
                    }
                    size={20}
                    color={
                      selectedAccountId === account.id ? "#1E3A8A" : "#6B7280"
                    }
                  />
                  <Text
                    style={[
                      styles.accountOptionText,
                      selectedAccountId === account.id
                        ? styles.selectedAccountOptionText
                        : null,
                    ]}
                  >
                    {account.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              {transactionType === "expense" ? "Merchant" : "Source"}
            </Text>
            <TextInput
              style={styles.textInput}
              placeholder={
                transactionType === "expense"
                  ? "e.g. Grocery Store"
                  : "e.g. Freelance Work"
              }
              value={merchant}
              onChangeText={setMerchant}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Amount</Text>
            <TextInput
              style={styles.textInput}
              placeholder="0.00"
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
            />
          </View>

          <Text style={styles.sectionTitle}>Category</Text>
          <View style={styles.categoriesContainer}>
            {filteredCategories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryItem,
                  selectedCategory?.id === category.id
                    ? styles.selectedCategory
                    : null,
                ]}
                onPress={() => setSelectedCategory(category)}
              >
                <View style={styles.categoryIcon}>
                  <Ionicons name={category.icon} size={22} color="#FFFFFF" />
                </View>
                <Text style={styles.categoryName}>{category.name}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.dateContainer}>
            <Text style={styles.inputLabel}>Date</Text>
            <Text style={styles.dateText}>{transaction.date}</Text>
            <Text style={styles.dateHint}>Date cannot be changed</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.submitContainer}>
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitText}>Update Transaction</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F7FF",
  },
  keyboardAvoid: {
    flex: 1,
    backgroundColor: "#F5F7FF",
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  toggleContainer: {
    flexDirection: "row",
    backgroundColor: "#E5E7EB",
    borderRadius: 8,
    marginVertical: 15,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 6,
  },
  activeToggle: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  toggleText: {
    fontWeight: "500",
    color: "#6B7280",
  },
  activeToggleText: {
    color: "#1E3A8A",
    fontWeight: "bold",
  },
  formContainer: {
    marginTop: 10,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#4B5563",
    marginBottom: 8,
  },
  accountSelectorContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  accountOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 5,
  },
  selectedAccountOption: {
    backgroundColor: "#E0E7FF",
    borderColor: "#1E3A8A",
    borderWidth: 1,
  },
  accountOptionText: {
    fontSize: 14,
    marginLeft: 8,
    color: "#4B5563",
  },
  selectedAccountOptionText: {
    color: "#1E3A8A",
    fontWeight: "bold",
  },
  textInput: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 15,
  },
  categoriesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 20,
  },
  categoryItem: {
    width: "30%",
    alignItems: "center",
    marginBottom: 15,
    marginRight: "5%",
  },
  categoryIcon: {
    backgroundColor: "#4F46E5",
    width: 45,
    height: 45,
    borderRadius: 22.5,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 5,
  },
  selectedCategory: {
    opacity: 1,
  },
  categoryName: {
    fontSize: 12,
    color: "#4B5563",
    textAlign: "center",
  },
  dateContainer: {
    marginVertical: 20,
  },
  dateText: {
    fontSize: 16,
    color: "#1F2937",
    padding: 12,
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
  },
  dateHint: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
    fontStyle: "italic",
  },
  submitContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  submitButton: {
    backgroundColor: "#1E3A8A",
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: "center",
  },
  submitText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
  },
});
