// This file contains our sample JSON data with the structure:
// date, category, name, mount (monetary amount)

export interface Transaction {
    id: number;
    date: string;
    category: string;
    name: string;
    mount: number;
  }
  
  // Sample transaction data - you can replace with your own
  export const transactionData: Transaction[] = [
    {
      id: 1,
      date: "2025-05-01",
      category: "Groceries",
      name: "Supermarket Shopping",
      mount: 85.42
    },
    {
      id: 2,
      date: "2025-05-02",
      category: "Entertainment",
      name: "Movie Tickets",
      mount: 24.99
    },
    {
      id: 3,
      date: "2025-05-03",
      category: "Bills",
      name: "Electricity Bill",
      mount: 128.75
    },
    {
      id: 4,
      date: "2025-05-03",
      category: "Transportation",
      name: "Gas Station",
      mount: 45.30
    },
    {
      id: 5,
      date: "2025-05-04",
      category: "Dining",
      name: "Restaurant Dinner",
      mount: 78.50
    },
    {
      id: 6,
      date: "2025-05-05",
      category: "Shopping",
      name: "Clothing Store",
      mount: 132.99
    },
    {
      id: 7,
      date: "2025-05-06",
      category: "Healthcare",
      name: "Pharmacy",
      mount: 37.25
    },
    {
      id: 8,
      date: "2025-05-06",
      category: "Groceries",
      name: "Local Market",
      mount: 42.18
    },
    {
      id: 9,
      date: "2025-05-07",
      category: "Bills",
      name: "Internet Service",
      mount: 59.99
    },
    {
      id: 10,
      date: "2025-05-07",
      category: "Entertainment",
      name: "Online Subscription",
      mount: 14.99
    }
  ];