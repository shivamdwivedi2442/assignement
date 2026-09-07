import React, { useEffect, useState } from "react";
import { SafeAreaView, View, Text, StyleSheet, FlatList } from "react-native";

import { io } from "socket.io-client";

const SOCKET_URL = "http://localhost:5000";

export default function App() {
  const [connected, setConnected] = useState(false);
  const [leads, setLeads] = useState([]);

  useEffect(() => {
    const socket = io(SOCKET_URL);

    socket.on("connect", () => {
      console.log("Connected to backend");
      setConnected(true);
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from backend");
      setConnected(false);
    });

    socket.on("new_lead", (lead) => {
      console.log("New lead received:", lead);

      setLeads((previousLeads) => [lead, ...previousLeads]);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const renderLead = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.name}>{item.name}</Text>

      <Text style={styles.info}>
        📧 {item.email}
      </Text>

      <Text style={styles.info}>
        📱 {item.phone}
      </Text>

      <Text style={styles.time}>
        {new Date(item.createdAt).toLocaleString()}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Meta Lead Dashboard</Text>

      <View
        style={[
          styles.status,
          {
            backgroundColor: connected ? "#d1fae5" : "#fee2e2",
          },
        ]}
      >
        <Text>
          {connected ? "🟢 Backend Connected" : "🔴 Backend Disconnected"}
        </Text>
      </View>

      <Text style={styles.heading}>
        Live Leads ({leads.length})
      </Text>

      {leads.length === 0 ? (
        <View style={styles.empty}>
          <Text>No leads received yet...</Text>
        </View>
      ) : (
        <FlatList
          data={leads}
          keyExtractor={(item) => item.id}
          renderItem={renderLead}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f5f5f5",
  },

  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 15,
  },

  status: {
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
  },

  heading: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 10,
  },

  card: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,

    elevation: 3,
  },

  name: {
    fontSize: 19,
    fontWeight: "bold",
    marginBottom: 8,
  },

  info: {
    fontSize: 15,
    marginBottom: 4,
  },

  time: {
    fontSize: 12,
    color: "gray",
    marginTop: 8,
  },

  empty: {
    alignItems: "center",
    marginTop: 50,
  },
});