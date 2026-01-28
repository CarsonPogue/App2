import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Text, Button, Input } from '@/components/atoms';
import { useForgotPassword } from '@/hooks';
import { colors, spacing } from '@/constants/theme';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const forgotPassword = useForgotPassword();

  const handleSubmit = async () => {
    if (!email) {
      setError('Email is required');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Invalid email address');
      return;
    }

    try {
      await forgotPassword.mutateAsync(email);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email');
    }
  };

  if (success) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <Text variant="h1" style={styles.title}>
            Check your email
          </Text>
          <Text variant="body" color={colors.text.muted} style={styles.subtitle}>
            We've sent a password reset link to {email}
          </Text>

          <Button
            title="Back to Sign In"
            onPress={() => router.replace('/(auth)/login')}
            size="large"
            fullWidth
            style={styles.button}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text variant="h3">←</Text>
        </TouchableOpacity>
        <Text variant="h1">Forgot{'\n'}password?</Text>
        <Text variant="body" color={colors.text.muted} style={styles.subtitle}>
          Enter your email and we'll send you a link to reset your password
        </Text>
      </View>

      <View style={styles.content}>
        <Input
          label="Email"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            setError('');
          }}
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          error={error}
        />

        <Button
          title="Send Reset Link"
          onPress={handleSubmit}
          loading={forgotPassword.isPending}
          size="large"
          fullWidth
          style={styles.button}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
    padding: spacing.lg,
  },
  header: {
    marginTop: spacing.xl,
    marginBottom: spacing.xxl,
  },
  backButton: {
    marginBottom: spacing.lg,
  },
  title: {
    marginBottom: spacing.md,
  },
  subtitle: {
    marginTop: spacing.sm,
  },
  content: {
    flex: 1,
  },
  button: {
    marginTop: spacing.lg,
  },
});
