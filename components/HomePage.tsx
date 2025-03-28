import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface AccountData {
  id: string;
  name: string;
  accountNumber: string;
  balance: number;
  currency: string;
  type: "chequing" | "savings";
}

type IconName = React.ComponentProps<typeof Ionicons>["name"];

interface Transaction {
  id: number;
  merchant: string;
  amount: number;
  date: string;
  icon: IconName;
  accountId: string;
}

interface QuickAction {
  id: number;
  name: string;
  icon: IconName;
}

const INITIAL_BALANCE = 0;

const HomePage: React.FC = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>("Home");

  const [accounts, setAccounts] = useState<AccountData[]>([
    {
      id: "chequing",
      name: "Chequing Account",
      accountNumber: "**** **** **** 1234",
      balance: INITIAL_BALANCE,
      currency: "USD",
      type: "chequing",
    },
    {
      id: "savings",
      name: "Savings Account",
      accountNumber: "**** **** **** 5678",
      balance: INITIAL_BALANCE,
      currency: "USD",
      type: "savings",
    },
  ]);

  const [selectedAccountId, setSelectedAccountId] =
    useState<string>("chequing");

  const defaultTransactions: Transaction[] = [
    {
      id: 1,
      merchant: "Coffee Shop",
      amount: -4.5,
      date: "Today, 8:30 AM",
      icon: "cafe-outline" as IconName,
      accountId: "chequing",
    },
    {
      id: 2,
      merchant: "Supermarket",
      amount: -65.2,
      date: "Yesterday, 6:15 PM",
      icon: "cart-outline" as IconName,
      accountId: "chequing",
    },
    {
      id: 3,
      merchant: "Salary Deposit",
      amount: 2500.0,
      date: "Mar 25, 2025",
      icon: "cash-outline" as IconName,
      accountId: "chequing",
    },
    {
      id: 4,
      merchant: "Electricity Bill",
      amount: -85.75,
      date: "Mar 23, 2025",
      icon: "flash-outline" as IconName,
      accountId: "chequing",
    },
    {
      id: 5,
      merchant: "Interest Payment",
      amount: 25.5,
      date: "Mar 20, 2025",
      icon: "trending-up-outline" as IconName,
      accountId: "savings",
    },
    {
      id: 6,
      merchant: "Savings Deposit",
      amount: 500.0,
      date: "Mar 15, 2025",
      icon: "cash-outline" as IconName,
      accountId: "savings",
    },
  ];

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);

  const quickActions: QuickAction[] = [
    { id: 1, name: "Send", icon: "arrow-up-outline" },
    { id: 2, name: "Request", icon: "arrow-down-outline" },
    { id: 3, name: "Pay", icon: "card-outline" },
    { id: 4, name: "More", icon: "grid-outline" },
  ];

  useEffect(() => {
    loadTransactions();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadTransactions();
    }, [])
  );

  const loadTransactions = async () => {
    try {
      const storedTransactions = await AsyncStorage.getItem("transactions");

      if (storedTransactions) {
        const parsedTransactions = JSON.parse(
          storedTransactions
        ) as Transaction[];
        setTransactions(parsedTransactions);

        updateBalances(parsedTransactions);
      } else {
        // No transactions found, initialize with default data for first launch
        await AsyncStorage.setItem(
          "transactions",
          JSON.stringify(defaultTransactions)
        );
        setTransactions(defaultTransactions);
        updateBalances(defaultTransactions);
      }
    } catch (error) {
      console.error("Error loading transactions:", error);
      setTransactions(defaultTransactions);
      updateBalances(defaultTransactions);
    }
  };

  const updateBalances = (transArray: Transaction[]) => {
    const updatedAccounts = accounts.map((account) => {
      // Calculate balance for this account only
      const accountTransactions = transArray.filter(
        (t) => t.accountId === account.id
      );
      const accountBalance = accountTransactions.reduce(
        (sum, transaction) => sum + transaction.amount,
        INITIAL_BALANCE
      );

      return {
        ...account,
        balance: accountBalance,
      };
    });

    setAccounts(updatedAccounts);
  };

  const formatCurrency = (amount: number): string => {
    const selectedAccount = accounts.find(
      (acc) => acc.id === selectedAccountId
    );
    const currency = selectedAccount ? selectedAccount.currency : "USD";
    return `${amount < 0 ? "-" : ""}${currency} ${Math.abs(amount).toFixed(2)}`;
  };

  const navigateToAddTransaction = () => {
    router.push({
      pathname: "/add-transaction",
      params: { accountId: selectedAccountId },
    });
  };

  const navigateToEditTransaction = (transaction: Transaction) => {
    router.push({
      pathname: "/edit-transaction",
      params: { transaction: JSON.stringify(transaction) },
    });
    setShowActionModal(false);
  };

  const deleteTransaction = async (id: number) => {
    try {
      const updatedTransactions = transactions.filter(
        (transaction) => transaction.id !== id
      );
      await AsyncStorage.setItem(
        "transactions",
        JSON.stringify(updatedTransactions)
      );
      setTransactions(updatedTransactions);
      updateBalances(updatedTransactions);
      Alert.alert("Success", "Transaction deleted successfully");
    } catch (error) {
      console.error("Error deleting transaction:", error);
      Alert.alert("Error", "Could not delete the transaction");
    }
    setShowActionModal(false);
  };

  const showDeleteConfirmation = (transaction: Transaction) => {
    Alert.alert(
      "Delete Transaction",
      `Are you sure you want to delete ${transaction.merchant}?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          onPress: () => deleteTransaction(transaction.id),
          style: "destructive",
        },
      ]
    );
    setShowActionModal(false);
  };

  const getTabIconName = (tab: string, isActive: boolean): IconName => {
    switch (tab) {
      case "Home":
        return isActive ? "home" : "home-outline";
      case "Cards":
        return isActive ? "card" : "card-outline";
      case "Payments":
        return isActive ? "cash" : "cash-outline";
      case "Insights":
        return isActive ? "bar-chart" : "bar-chart-outline";
      case "More":
        return isActive ? "menu" : "menu-outline";
      default:
        return "at-circle-outline";
    }
  };

  const selectedAccount =
    accounts.find((acc) => acc.id === selectedAccountId) || accounts[0];
  const filteredTransactions = transactions.filter(
    (transaction) => transaction.accountId === selectedAccountId
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Welcome back,</Text>
          <Text style={styles.nameText}>John Doe</Text>
        </View>
        <TouchableOpacity style={styles.profileButton}>
          <Ionicons name="person-circle-outline" size={40} color="#1E3A8A" />
        </TouchableOpacity>
      </View>

      <View style={styles.balanceCard}>
        <TouchableOpacity
          style={styles.accountSelector}
          onPress={() => setShowAccountModal(true)}
        >
          <Text style={styles.accountName}>{selectedAccount.name}</Text>
          <Ionicons name="chevron-down" size={20} color="#FFFFFF" />
        </TouchableOpacity>

        <Text style={styles.balanceTitle}>Available Balance</Text>
        <Text style={styles.balanceAmount}>
          {selectedAccount.currency}{" "}
          {selectedAccount.balance.toLocaleString(undefined, {
            minimumFractionDigits: 2,
          })}
        </Text>
        <Text style={styles.accountNumber}>
          {selectedAccount.accountNumber}
        </Text>

        <View style={styles.quickActionsContainer}>
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={styles.quickActionButton}
              onPress={
                action.name === "More" ? navigateToAddTransaction : undefined
              }
            >
              <View style={styles.actionIconContainer}>
                <Ionicons name={action.icon} size={22} color="#ffffff" />
              </View>
              <Text style={styles.actionText}>{action.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.transactionsContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          <TouchableOpacity onPress={navigateToAddTransaction}>
            <Text style={styles.seeAllText}>Add New</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.transactionsList}>
          {filteredTransactions.length > 0 ? (
            filteredTransactions.map((transaction) => (
              <TouchableOpacity
                key={transaction.id}
                style={styles.transactionItem}
                onPress={() => {
                  setSelectedTransaction(transaction);
                  setShowActionModal(true);
                }}
              >
                <View style={styles.transactionIconContainer}>
                  <Ionicons name={transaction.icon} size={20} color="#ffffff" />
                </View>
                <View style={styles.transactionDetails}>
                  <Text style={styles.merchantName}>
                    {transaction.merchant}
                  </Text>
                  <Text style={styles.transactionDate}>{transaction.date}</Text>
                </View>
                <Text
                  style={[
                    styles.transactionAmount,
                    transaction.amount < 0
                      ? styles.negativeAmount
                      : styles.positiveAmount,
                  ]}
                >
                  {formatCurrency(transaction.amount)}
                </Text>
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.emptyText}>
              No transactions in this account yet. Add one to get started!
            </Text>
          )}
        </ScrollView>
      </View>

      <View style={styles.bottomNav}>
        {["Home", "Cards", "Payments", "Insights", "More"].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={styles.navItem}
            onPress={() => setActiveTab(tab)}
          >
            <Ionicons
              name={getTabIconName(tab, activeTab === tab)}
              size={22}
              color={activeTab === tab ? "#1E3A8A" : "#9CA3AF"}
            />
            <Text
              style={[
                styles.navText,
                activeTab === tab ? styles.activeNavText : null,
              ]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Transaction Actions Modal */}
      <Modal
        visible={showActionModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowActionModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowActionModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <TouchableOpacity
                style={styles.modalOption}
                onPress={() =>
                  selectedTransaction &&
                  navigateToEditTransaction(selectedTransaction)
                }
              >
                <Ionicons name="pencil-outline" size={24} color="#1E3A8A" />
                <Text style={styles.modalOptionText}>Edit Transaction</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalOption, styles.deleteOption]}
                onPress={() =>
                  selectedTransaction &&
                  showDeleteConfirmation(selectedTransaction)
                }
              >
                <Ionicons name="trash-outline" size={24} color="#EF4444" />
                <Text style={styles.deleteOptionText}>Delete Transaction</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalOption, styles.cancelOption]}
                onPress={() => setShowActionModal(false)}
              >
                <Text style={styles.cancelOptionText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Account Selection Modal */}
      <Modal
        visible={showAccountModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAccountModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowAccountModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Account</Text>

              {accounts.map((account) => (
                <TouchableOpacity
                  key={account.id}
                  style={[
                    styles.accountOption,
                    selectedAccountId === account.id &&
                      styles.selectedAccountOption,
                  ]}
                  onPress={() => {
                    setSelectedAccountId(account.id);
                    setShowAccountModal(false);
                  }}
                >
                  <View style={styles.accountOptionIconContainer}>
                    <Ionicons
                      name={
                        account.type === "chequing"
                          ? "wallet-outline"
                          : "save-outline"
                      }
                      size={24}
                      color={
                        selectedAccountId === account.id ? "#1E3A8A" : "#6B7280"
                      }
                    />
                  </View>
                  <View style={styles.accountOptionDetails}>
                    <Text
                      style={[
                        styles.accountOptionName,
                        selectedAccountId === account.id &&
                          styles.selectedAccountOptionText,
                      ]}
                    >
                      {account.name}
                    </Text>
                    <Text style={styles.accountOptionBalance}>
                      {account.currency}{" "}
                      {account.balance.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}
                    </Text>
                  </View>
                  {selectedAccountId === account.id && (
                    <Ionicons
                      name="checkmark-circle"
                      size={24}
                      color="#1E3A8A"
                    />
                  )}
                </TouchableOpacity>
              ))}

              <TouchableOpacity
                style={[styles.modalOption, styles.cancelOption]}
                onPress={() => setShowAccountModal(false)}
              >
                <Text style={styles.cancelOptionText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FF",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 10,
  },
  welcomeText: {
    fontSize: 14,
    color: "#6B7280",
  },
  nameText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
  },
  profileButton: {
    padding: 5,
  },
  balanceCard: {
    backgroundColor: "#1E3A8A",
    borderRadius: 16,
    padding: 20,
    margin: 20,
    marginTop: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  accountSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  accountName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginRight: 5,
  },
  balanceTitle: {
    fontSize: 14,
    color: "#D1D5DB",
    marginBottom: 5,
  },
  balanceAmount: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 5,
  },
  accountNumber: {
    fontSize: 12,
    color: "#9CA3AF",
    marginBottom: 20,
  },
  quickActionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  quickActionButton: {
    alignItems: "center",
  },
  actionIconContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 12,
    padding: 10,
    marginBottom: 5,
  },
  actionText: {
    fontSize: 12,
    color: "#FFFFFF",
  },
  transactionsContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
  },
  seeAllText: {
    fontSize: 14,
    color: "#1E3A8A",
    fontWeight: "500",
  },
  transactionsList: {
    flex: 1,
  },
  transactionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  transactionIconContainer: {
    backgroundColor: "#4F46E5",
    borderRadius: 10,
    padding: 8,
    marginRight: 15,
  },
  transactionDetails: {
    flex: 1,
  },
  merchantName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1F2937",
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
    color: "#6B7280",
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: "600",
  },
  negativeAmount: {
    color: "#EF4444",
  },
  positiveAmount: {
    color: "#10B981",
  },
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  navItem: {
    alignItems: "center",
    justifyContent: "center",
  },
  navText: {
    fontSize: 12,
    marginTop: 2,
    color: "#9CA3AF",
  },
  activeNavText: {
    color: "#1E3A8A",
    fontWeight: "500",
  },
  emptyText: {
    textAlign: "center",
    color: "#6B7280",
    marginTop: 30,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "transparent",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingVertical: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
    textAlign: "center",
    marginBottom: 20,
  },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  modalOptionText: {
    fontSize: 16,
    marginLeft: 15,
    color: "#1F2937",
  },
  deleteOption: {
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  deleteOptionText: {
    fontSize: 16,
    marginLeft: 15,
    color: "#EF4444",
  },
  cancelOption: {
    justifyContent: "center",
    marginTop: 10,
  },
  cancelOptionText: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    fontWeight: "500",
  },
  accountOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  selectedAccountOption: {
    backgroundColor: "#F9FAFB",
  },
  accountOptionIconContainer: {
    backgroundColor: "#F3F4F6",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  accountOptionDetails: {
    flex: 1,
  },
  accountOptionName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1F2937",
    marginBottom: 4,
  },
  selectedAccountOptionText: {
    color: "#1E3A8A",
    fontWeight: "bold",
  },
  accountOptionBalance: {
    fontSize: 14,
    color: "#6B7280",
  },
});

export default HomePage;
