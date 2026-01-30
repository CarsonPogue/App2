import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Text, Button, Chip, Input } from '@/components/atoms';
import { SearchBar, ArtistCard, TeamCard } from '@/components/molecules';
import { useLocationStore } from '@/stores';
import { api } from '@/services/api';
import { colors, spacing, borderRadius, layout } from '@/constants/theme';
import { MUSIC_GENRES, INTEREST_CATEGORIES } from '@moove/shared/constants';

// Step configuration with fun copy and gradient colors
const STEP_CONFIG = [
  {
    title: "Who's on your playlist? 🎵",
    subtitle: "We'll let you know when your faves are in town",
    gradientColors: ['#FF6B6B', '#FF8E53'] as const,
    emoji: '🎤',
  },
  {
    title: "What sounds make you move? 🎶",
    subtitle: "Pick your favorite vibes",
    gradientColors: ['#667eea', '#764ba2'] as const,
    emoji: '🎧',
  },
  {
    title: "Who's your squad? 🏆",
    subtitle: "Never miss a game day again",
    gradientColors: ['#11998e', '#38ef7d'] as const,
    emoji: '⚽',
  },
  {
    title: "What gets you excited? ✨",
    subtitle: "Help us find your perfect events",
    gradientColors: ['#f093fb', '#f5576c'] as const,
    emoji: '🎉',
  },
  {
    title: "Where's the party at? 📍",
    subtitle: "Show us where you like to hang",
    gradientColors: ['#4facfe', '#00f2fe'] as const,
    emoji: '🌆',
  },
];

const STEPS = ['Artists', 'Genres', 'Sports', 'Interests', 'Location'];

interface Artist {
  id: string;
  name: string;
  imageUrl: string | null;
  genres: string[];
  upcomingEvents: number;
}

interface SportsTeam {
  id: string;
  name: string;
  imageUrl: string | null;
  sport: string;
  league: string;
  upcomingEvents: number;
}


export default function OnboardingScreen() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // Step 1: Artists
  const [artistSearch, setArtistSearch] = useState('');
  const [selectedArtists, setSelectedArtists] = useState<Artist[]>([]);
  const [suggestedArtists, setSuggestedArtists] = useState<Artist[]>([]);
  const [searchResults, setSearchResults] = useState<Artist[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [artistsLoading, setArtistsLoading] = useState(true);

  // Load popular artists on mount
  useEffect(() => {
    const loadPopularArtists = async () => {
      try {
        const { artists } = await api.getPopularArtists();
        setSuggestedArtists(artists);
      } catch (error) {
        console.error('Failed to load popular artists:', error);
      } finally {
        setArtistsLoading(false);
      }
    };
    loadPopularArtists();
  }, []);

  // Debounced search
  useEffect(() => {
    if (!artistSearch.trim()) {
      setSearchResults([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsSearching(true);
      try {
        const { artists } = await api.searchArtists(artistSearch);
        setSearchResults(artists);
      } catch (error) {
        console.error('Failed to search artists:', error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [artistSearch]);

  // Step 2: Genres
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);

  // Step 3: Sports
  const [teamSearch, setTeamSearch] = useState('');
  const [selectedTeams, setSelectedTeams] = useState<SportsTeam[]>([]);
  const [suggestedTeams, setSuggestedTeams] = useState<SportsTeam[]>([]);
  const [teamSearchResults, setTeamSearchResults] = useState<SportsTeam[]>([]);
  const [isSearchingTeams, setIsSearchingTeams] = useState(false);
  const [teamsLoading, setTeamsLoading] = useState(true);

  // Load popular teams on mount
  useEffect(() => {
    const loadPopularTeams = async () => {
      try {
        const { teams } = await api.getPopularSportsTeams();
        setSuggestedTeams(teams);
      } catch (error) {
        console.error('Failed to load popular teams:', error);
      } finally {
        setTeamsLoading(false);
      }
    };
    loadPopularTeams();
  }, []);

  // Debounced team search
  useEffect(() => {
    if (!teamSearch.trim()) {
      setTeamSearchResults([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsSearchingTeams(true);
      try {
        const { teams } = await api.searchSportsTeams(teamSearch);
        setTeamSearchResults(teams);
      } catch (error) {
        console.error('Failed to search teams:', error);
      } finally {
        setIsSearchingTeams(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [teamSearch]);

  // Step 4: Interests
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  // Step 5: Location
  const requestPermission = useLocationStore((state) => state.requestPermission);
  const location = useLocationStore((state) => state.location);
  const hasRealLocation = useLocationStore((state) => state.hasRealLocation);
  const setStoreRadius = useLocationStore((state) => state.setRadius);
  const [radiusMiles, setRadiusMiles] = useState(25);

  // Sync radius to store when it changes
  useEffect(() => {
    setStoreRadius(radiusMiles);
  }, [radiusMiles, setStoreRadius]);

  const handleNext = async () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      // Complete onboarding
      setLoading(true);
      try {
        await api.updatePreferences({
          favoriteArtists: selectedArtists.map(artist => ({
            id: artist.id,
            name: artist.name,
            imageUrl: artist.imageUrl ?? undefined,
          })),
          favoriteGenres: selectedGenres,
          sportsTeams: selectedTeams.map(team => ({
            id: team.id,
            name: team.name,
            sport: team.sport,
            logoUrl: team.imageUrl ?? undefined,
          })),
          interests: selectedInterests,
          radiusMiles,
        });

        if (location) {
          await api.updateLocation(location.latitude, location.longitude);
        }
      } catch (error) {
        console.error('Failed to save preferences:', error);
        // Continue to home even if saving preferences fails
      } finally {
        setLoading(false);
        // Always navigate to home after onboarding
        router.replace('/(tabs)/home');
      }
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const handleSkip = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      router.replace('/(tabs)/home');
    }
  };

  const handleSelectArtist = (artist: Artist) => {
    if (!selectedArtists.some((a) => a.id === artist.id)) {
      setSelectedArtists([...selectedArtists, artist]);
    }
    setArtistSearch('');
    setSearchResults([]);
  };

  const handleRemoveArtist = (id: string) => {
    setSelectedArtists(selectedArtists.filter((a) => a.id !== id));
  };

  const isArtistSelected = (id: string) => selectedArtists.some((a) => a.id === id);

  const toggleGenre = (genre: string) => {
    if (selectedGenres.includes(genre)) {
      setSelectedGenres(selectedGenres.filter((g) => g !== genre));
    } else {
      setSelectedGenres([...selectedGenres, genre]);
    }
  };

  const handleSelectTeam = (team: SportsTeam) => {
    if (!selectedTeams.some((t) => t.id === team.id)) {
      setSelectedTeams([...selectedTeams, team]);
    }
    setTeamSearch('');
    setTeamSearchResults([]);
  };

  const handleRemoveTeam = (id: string) => {
    setSelectedTeams(selectedTeams.filter((t) => t.id !== id));
  };

  const isTeamSelected = (id: string) => selectedTeams.some((t) => t.id === id);

  const toggleInterest = (interest: string) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter((i) => i !== interest));
    } else {
      setSelectedInterests([...selectedInterests, interest]);
    }
  };

  const handleLocationPermission = async () => {
    await requestPermission();
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        const displayArtists = artistSearch.trim() ? searchResults : suggestedArtists;
        return (
          <View style={styles.stepContent}>
            <View style={styles.stepHeader}>
              <View style={styles.emojiContainer}>
                <Text style={styles.stepEmoji}>{STEP_CONFIG[step].emoji}</Text>
              </View>
              <Text variant="h2" style={styles.stepTitle}>
                {STEP_CONFIG[step].title}
              </Text>
              <Text variant="body" color={colors.text.muted} style={styles.stepSubtitle}>
                {STEP_CONFIG[step].subtitle}
              </Text>
            </View>

            <View style={styles.artistInput}>
              <Input
                value={artistSearch}
                onChangeText={setArtistSearch}
                placeholder="Search for an artist..."
                returnKeyType="search"
              />
            </View>

            {/* Selected Artists */}
            {selectedArtists.length > 0 && (
              <View style={styles.selectedSection}>
                <Text variant="label" color={colors.text.muted} style={styles.sectionLabel}>
                  Selected ({selectedArtists.length})
                </Text>
                <View style={styles.artistGrid}>
                  {selectedArtists.map((artist) => (
                    <ArtistCard
                      key={artist.id}
                      artist={artist}
                      selected
                      onPress={() => handleRemoveArtist(artist.id)}
                    />
                  ))}
                </View>
              </View>
            )}

            {/* Search Results or Popular Artists */}
            <View style={styles.suggestionsSection}>
              <Text variant="label" color={colors.text.muted} style={styles.sectionLabel}>
                {artistSearch.trim() ? 'Search Results' : 'Popular Artists'}
              </Text>
              {(artistsLoading || isSearching) ? (
                <ActivityIndicator color={colors.primary.kineticOrange} style={styles.loader} />
              ) : (
                <View style={styles.artistGrid}>
                  {displayArtists.map((artist) => (
                    <ArtistCard
                      key={artist.id}
                      artist={artist}
                      selected={isArtistSelected(artist.id)}
                      onPress={() => isArtistSelected(artist.id) ? handleRemoveArtist(artist.id) : handleSelectArtist(artist)}
                    />
                  ))}
                  {artistSearch.trim() && displayArtists.length === 0 && (
                    <Text variant="body" color={colors.text.muted}>
                      No artists found for "{artistSearch}"
                    </Text>
                  )}
                </View>
              )}
            </View>
          </View>
        );

      case 1:
        return (
          <View style={styles.stepContent}>
            <View style={styles.stepHeader}>
              <View style={styles.emojiContainer}>
                <Text style={styles.stepEmoji}>{STEP_CONFIG[step].emoji}</Text>
              </View>
              <Text variant="h2" style={styles.stepTitle}>
                {STEP_CONFIG[step].title}
              </Text>
              <Text variant="body" color={colors.text.muted} style={styles.stepSubtitle}>
                {STEP_CONFIG[step].subtitle}
              </Text>
            </View>

            <View style={styles.chipContainer}>
              {MUSIC_GENRES.map((genre) => (
                <Chip
                  key={genre}
                  label={genre}
                  selected={selectedGenres.includes(genre)}
                  onPress={() => toggleGenre(genre)}
                />
              ))}
            </View>
          </View>
        );

      case 2:
        const displayTeams = teamSearch.trim() ? teamSearchResults : suggestedTeams;
        return (
          <View style={styles.stepContent}>
            <View style={styles.stepHeader}>
              <View style={styles.emojiContainer}>
                <Text style={styles.stepEmoji}>{STEP_CONFIG[step].emoji}</Text>
              </View>
              <Text variant="h2" style={styles.stepTitle}>
                {STEP_CONFIG[step].title}
              </Text>
              <Text variant="body" color={colors.text.muted} style={styles.stepSubtitle}>
                {STEP_CONFIG[step].subtitle}
              </Text>
            </View>

            <View style={styles.artistInput}>
              <Input
                value={teamSearch}
                onChangeText={setTeamSearch}
                placeholder="Search for a team..."
                returnKeyType="search"
              />
            </View>

            {/* Selected Teams */}
            {selectedTeams.length > 0 && (
              <View style={styles.selectedSection}>
                <Text variant="label" color={colors.text.muted} style={styles.sectionLabel}>
                  Selected ({selectedTeams.length})
                </Text>
                <View style={styles.artistGrid}>
                  {selectedTeams.map((team) => (
                    <TeamCard
                      key={team.id}
                      team={team}
                      selected
                      onPress={() => handleRemoveTeam(team.id)}
                    />
                  ))}
                </View>
              </View>
            )}

            {/* Search Results or Popular Teams */}
            <View style={styles.suggestionsSection}>
              <Text variant="label" color={colors.text.muted} style={styles.sectionLabel}>
                {teamSearch.trim() ? 'Search Results' : 'Popular Teams'}
              </Text>
              {(teamsLoading || isSearchingTeams) ? (
                <ActivityIndicator color={colors.primary.kineticOrange} style={styles.loader} />
              ) : (
                <View style={styles.artistGrid}>
                  {displayTeams.map((team) => (
                    <TeamCard
                      key={team.id}
                      team={team}
                      selected={isTeamSelected(team.id)}
                      onPress={() => isTeamSelected(team.id) ? handleRemoveTeam(team.id) : handleSelectTeam(team)}
                    />
                  ))}
                  {teamSearch.trim() && displayTeams.length === 0 && (
                    <Text variant="body" color={colors.text.muted}>
                      No teams found for "{teamSearch}"
                    </Text>
                  )}
                </View>
              )}
            </View>
          </View>
        );

      case 3:
        return (
          <View style={styles.stepContent}>
            <View style={styles.stepHeader}>
              <View style={styles.emojiContainer}>
                <Text style={styles.stepEmoji}>{STEP_CONFIG[step].emoji}</Text>
              </View>
              <Text variant="h2" style={styles.stepTitle}>
                {STEP_CONFIG[step].title}
              </Text>
              <Text variant="body" color={colors.text.muted} style={styles.stepSubtitle}>
                {STEP_CONFIG[step].subtitle}
              </Text>
            </View>

            <View style={styles.chipContainer}>
              {INTEREST_CATEGORIES.map((interest) => (
                <Chip
                  key={interest.id}
                  label={interest.name}
                  selected={selectedInterests.includes(interest.id)}
                  onPress={() => toggleInterest(interest.id)}
                />
              ))}
            </View>
          </View>
        );

      case 4:
        return (
          <View style={styles.stepContent}>
            <View style={styles.stepHeader}>
              <View style={styles.emojiContainer}>
                <Text style={styles.stepEmoji}>{STEP_CONFIG[step].emoji}</Text>
              </View>
              <Text variant="h2" style={styles.stepTitle}>
                {STEP_CONFIG[step].title}
              </Text>
              <Text variant="body" color={colors.text.muted} style={styles.stepSubtitle}>
                {STEP_CONFIG[step].subtitle}
              </Text>
            </View>

            {!hasRealLocation ? (
              <Button
                title="Enable Location"
                onPress={handleLocationPermission}
                size="large"
                fullWidth
                style={styles.locationButton}
              />
            ) : (
              <View style={styles.locationConfirm}>
                <Text variant="body" color={colors.success}>
                  ✓ Location enabled
                </Text>
              </View>
            )}

            <View style={styles.radiusSelector}>
              <Text variant="label">Search radius: {radiusMiles} miles</Text>
              <View style={styles.radiusOptions}>
                {[10, 25, 50, 100].map((miles) => (
                  <TouchableOpacity
                    key={miles}
                    style={[
                      styles.radiusOption,
                      radiusMiles === miles && styles.radiusOptionSelected,
                    ]}
                    onPress={() => setRadiusMiles(miles)}
                  >
                    <Text
                      variant="label"
                      color={radiusMiles === miles ? colors.white : colors.text.primary}
                    >
                      {miles}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  const currentConfig = STEP_CONFIG[step];

  return (
    <View style={styles.container}>
      {/* Gradient accent at top */}
      <LinearGradient
        colors={[...currentConfig.gradientColors]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientAccent}
      />

      {/* Progress */}
      <View style={styles.progressContainer}>
        {STEPS.map((_, index) => (
          <View
            key={index}
            style={[
              styles.progressDot,
              index <= step && styles.progressDotActive,
            ]}
          />
        ))}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderStep()}
      </ScrollView>

      {/* Navigation */}
      <View style={styles.navigation}>
        {step > 0 && (
          <Button
            title="Back"
            variant="ghost"
            onPress={handleBack}
            style={styles.backButton}
          />
        )}

        <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
          <Text variant="label" color={colors.text.muted}>
            Skip
          </Text>
        </TouchableOpacity>

        <Button
          title={step === STEPS.length - 1 ? "Let's Go!" : 'Next'}
          onPress={handleNext}
          loading={loading}
          style={styles.nextButton}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  gradientAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 300,
    opacity: 0.2,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl + spacing.xl,
    paddingBottom: spacing.md,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.gray[300],
  },
  progressDotActive: {
    backgroundColor: colors.primary.kineticOrange,
    width: 24,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  stepContent: {
    flex: 1,
  },
  stepHeader: {
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingTop: spacing.sm,
    overflow: 'visible',
  },
  emojiContainer: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  stepEmoji: {
    fontSize: 56,
  },
  stepTitle: {
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  stepSubtitle: {
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  artistInput: {
    marginBottom: spacing.md,
  },
  selectedSection: {
    marginBottom: spacing.lg,
  },
  suggestionsSection: {
    flex: 1,
  },
  sectionLabel: {
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  loader: {
    marginTop: spacing.lg,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'center',
  },
  artistGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'center',
  },
  locationButton: {
    marginVertical: spacing.xl,
  },
  locationConfirm: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  radiusSelector: {
    marginTop: spacing.xl,
  },
  radiusOptions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  radiusOption: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
  },
  radiusOptionSelected: {
    backgroundColor: colors.primary.kineticOrange,
  },
  navigation: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  backButton: {
    marginRight: 'auto',
  },
  skipButton: {
    marginRight: spacing.md,
  },
  nextButton: {
    minWidth: 120,
  },
});
