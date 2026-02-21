import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Linking, ScrollView, StyleSheet, Text, View } from "react-native";

const PrivacyPolicyScreen = () => {
  return (
    <LinearGradient
      colors={["#0b1f16", "#0f2a1c", "#122f21"]}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Privacy Policy</Text>
        <Text style={styles.meta}>Last updated: February 21, 2026</Text>
        <Text style={styles.introBody}>
          This Privacy Policy explains how RecipeFlow collects, uses, stores,
          and shares personal data when you use the app.
        </Text>

        <Section title="Data We Collect">
          <Bullet text="Account data: email address, username, and user ID." />
          <Bullet text="Profile data: optional address, phone number, profile image, currency preference, AI credits, and last sign-in timestamp." />
          <Bullet text="Recipe and planner data: saved recipes (parsed ingredients), planner entries, planned dates/times, and recipe website links." />
          <Bullet text="Cart data: ingredients you add, edit, or delete in your cart." />
          <Bullet text="Advertising/diagnostic data: app may use Google Mobile Ads SDK, which may process device identifiers and ad diagnostics." />
        </Section>

        <Section title="How We Use Data">
          <Bullet text="To create and manage your account." />
          <Bullet text="To save recipes, planner cards, and cart content." />
          <Bullet text="To support rewarded ads and improve app reliability." />
        </Section>

        <Section title="Data Storage and Providers">
          <Bullet text="Firebase Authentication is used for sign-in and account identity." />
          <Bullet text="Cloud Firestore is used to store user profile and app content under your user account." />
          <Bullet text="Google Sign-In may be used if you choose Google login." />
          <Bullet text="Google Mobile Ads may process data for ad serving and measurement." />
          <Text
            style={styles.link}
            onPress={() => Linking.openURL("https://policies.google.com/privacy")}
          >
            Google/Firebase Privacy Policy: https://policies.google.com/privacy
          </Text>
        </Section>

        <Section title="Data Sharing">
          <Text style={styles.body}>
            We do not sell your personal data. Data is shared with service
            providers only as needed to operate app functionality described
            above.
          </Text>
        </Section>

        <Section title="Your Choices and Rights">
          <Bullet text="You can edit profile information in the app." />
          <Bullet text="You can request account deletion from the Profile tab. Deletion removes your account and associated user data stored by the app." />
        </Section>

        <Section title="Contact">
          <Text style={styles.body}>
            For privacy requests or questions, contact the app publisher at
            support contact details listed in the store page.
          </Text>
        </Section>
      </ScrollView>
    </LinearGradient>
  );
};

const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>
);

const Bullet = ({ text }: { text: string }) => (
  <Text style={styles.bullet}>- {text}</Text>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 28,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#f8fafc",
  },
  meta: {
    marginTop: 6,
    marginBottom: 10,
    fontSize: 12,
    color: "#cbd5e1",
  },
  section: {
    marginTop: 14,
    backgroundColor: "rgba(254, 243, 199, 0.95)",
    borderRadius: 12,
    padding: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 6,
  },
  introBody: {
    fontSize: 14,
    lineHeight: 20,
    color: "#e2e8f0",
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
    color: "#334155",
  },
  bullet: {
    fontSize: 14,
    lineHeight: 20,
    color: "#334155",
    marginBottom: 3,
  },
  link: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    color: "#0369a1",
    textDecorationLine: "underline",
  },
});

export default PrivacyPolicyScreen;
