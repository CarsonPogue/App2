import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Link } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Text, Button } from '@/components/atoms';
import { colors, spacing } from '@/constants/theme';
import { useEffect } from 'react';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const gradientRotation = useSharedValue(0);

  useEffect(() => {
    gradientRotation.value = withRepeat(
      withTiming(360, { duration: 20000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const animatedGradientStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${gradientRotation.value}deg` }],
  }));

  return (
    <View style={styles.container}>
      {/* Animated background */}
      <Animated.View style={[styles.gradientContainer, animatedGradientStyle]}>
        <LinearGradient
          colors={[
            colors.primary.kineticOrange,
            colors.accent.pulsePurple,
            colors.secondary.electricTeal,
            colors.primary.kineticOrange,
          ]}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>

      {/* Dark overlay */}
      <View style={styles.overlay} />

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.hero}>
          <Text variant="h1" color={colors.white} center style={styles.title}>
            MOOVE
          </Text>
          <Text variant="bodyLarge" color={colors.white} center style={styles.tagline}>
            Discover what's happening around you.{'\n'}Find your vibe tonight.
          </Text>
        </View>

        <View style={styles.actions}>
          <Link href="/(auth)/login" asChild>
            <Button
              title="Sign In"
              variant="primary"
              size="large"
              fullWidth
            />
          </Link>

          <Link href="/(auth)/register" asChild>
            <Button
              title="Create Account"
              variant="secondary"
              size="large"
              fullWidth
              style={styles.secondaryButton}
              textStyle={{ color: colors.white }}
            />
          </Link>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text variant="label" color={colors.gray[400]} style={styles.dividerText}>
              or continue with
            </Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.socialButtons}>
            <Button
              title="Google"
              variant="ghost"
              size="medium"
              style={styles.socialButton}
              textStyle={{ color: colors.white }}
              onPress={() => {}}
            />
            <Button
              title="Apple"
              variant="ghost"
              size="medium"
              style={styles.socialButton}
              textStyle={{ color: colors.white }}
              onPress={() => {}}
            />
          </View>
        </View>

        <View style={styles.footer}>
          <Text variant="labelSmall" color={colors.gray[400]} center>
            By continuing, you agree to our{' '}
            <Text variant="labelSmall" color={colors.white}>
              Terms of Service
            </Text>
            {' '}and{' '}
            <Text variant="labelSmall" color={colors.white}>
              Privacy Policy
            </Text>
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary.deepMidnight,
  },
  gradientContainer: {
    position: 'absolute',
    width: width * 2,
    height: height * 2,
    top: -height / 2,
    left: -width / 2,
  },
  gradient: {
    flex: 1,
    opacity: 0.3,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(13, 13, 26, 0.85)',
  },
  content: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'space-between',
  },
  hero: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 56,
    fontWeight: '800',
    letterSpacing: 4,
    marginBottom: spacing.md,
  },
  tagline: {
    opacity: 0.9,
    lineHeight: 28,
  },
  actions: {
    marginBottom: spacing.xl,
  },
  secondaryButton: {
    marginTop: spacing.md,
    borderColor: colors.white,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.gray[700],
  },
  dividerText: {
    marginHorizontal: spacing.md,
  },
  socialButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  socialButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.gray[600],
  },
  footer: {
    paddingBottom: spacing.xl,
  },
});
