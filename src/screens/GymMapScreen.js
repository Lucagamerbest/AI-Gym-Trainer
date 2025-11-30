import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
  Platform,
  Keyboard,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { Spacing, Typography, BorderRadius } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { LocationService } from '../services/LocationService';
import Constants from 'expo-constants';

const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.01;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

// Get API key from app config
const GOOGLE_MAPS_API_KEY = Constants.expoConfig?.extra?.googleMapsApiKey || '';

export default function GymMapScreen({ navigation, route }) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const userId = user?.uid || 'guest';
  const styles = useMemo(() => createStyles(colors), [colors]);
  const mapRef = useRef(null);

  // State
  const [region, setRegion] = useState({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: LATITUDE_DELTA,
    longitudeDelta: LONGITUDE_DELTA,
  });
  const [currentLocation, setCurrentLocation] = useState(null);
  const [savedGyms, setSavedGyms] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load current location and saved gyms on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Get current location
      const locationResult = await LocationService.getCurrentLocation();
      if (locationResult.success) {
        const { latitude, longitude } = locationResult.location;
        setCurrentLocation({ latitude, longitude });
        setRegion({
          latitude,
          longitude,
          latitudeDelta: LATITUDE_DELTA,
          longitudeDelta: LONGITUDE_DELTA,
        });
      }

      // Get saved gyms
      const gyms = await LocationService.getGymLocations(userId);
      setSavedGyms(gyms);
    } catch (error) {
      console.error('Error loading map data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMapPress = async (event) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;

    // Get address for the tapped location
    const geoResult = await LocationService.reverseGeocode(latitude, longitude);

    setSelectedLocation({
      latitude,
      longitude,
      address: geoResult.success ? geoResult.address.formatted : '',
      name: '',
    });
  };

  const handlePlaceSelect = (data, details) => {
    if (details?.geometry?.location) {
      const { lat, lng } = details.geometry.location;

      setSelectedLocation({
        latitude: lat,
        longitude: lng,
        address: details.formatted_address || data.description,
        name: details.name || data.structured_formatting?.main_text || '',
        placeId: data.place_id,
      });

      // Animate to the selected location
      mapRef.current?.animateToRegion({
        latitude: lat,
        longitude: lng,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      });

      Keyboard.dismiss();
    }
  };

  const handleSaveGym = async () => {
    if (!selectedLocation) {
      Alert.alert('No Location', 'Please select a location on the map or search for a gym');
      return;
    }

    const gymName = selectedLocation.name || 'My Gym';

    Alert.prompt
      ? Alert.prompt(
          'Name Your Gym',
          'Enter a name for this gym location',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Save',
              onPress: (name) => saveGymLocation(name || gymName),
            },
          ],
          'plain-text',
          gymName
        )
      : // Android fallback - just use the name from Google Places or default
        Alert.alert('Save Gym', `Save "${gymName}" as your gym?`, [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Save', onPress: () => saveGymLocation(gymName) },
        ]);
  };

  const saveGymLocation = async (name) => {
    setSaving(true);
    try {
      const result = await LocationService.saveGymLocation(
        {
          name: name.trim() || 'My Gym',
          latitude: selectedLocation.latitude,
          longitude: selectedLocation.longitude,
          address: selectedLocation.address,
        },
        userId
      );

      if (result.success) {
        setSavedGyms((prev) => [...prev, result.gym]);
        setSelectedLocation(null);
        Alert.alert('Success', `${result.gym.name} has been saved!`, [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert('Error', result.error || 'Failed to save gym');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save gym location');
    } finally {
      setSaving(false);
    }
  };

  const handleCenterOnMe = () => {
    if (currentLocation) {
      mapRef.current?.animateToRegion({
        ...currentLocation,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      });
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading map...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={region}
        showsUserLocation
        showsMyLocationButton={false}
        onPress={handleMapPress}
      >
        {/* Saved gym markers */}
        {savedGyms.map((gym) => (
          <Marker
            key={gym.id}
            coordinate={{
              latitude: gym.latitude,
              longitude: gym.longitude,
            }}
            title={gym.name}
            description={gym.address}
            pinColor={gym.isPrimary ? colors.primary : colors.success}
          />
        ))}

        {/* Selected location marker */}
        {selectedLocation && (
          <Marker
            coordinate={{
              latitude: selectedLocation.latitude,
              longitude: selectedLocation.longitude,
            }}
            title={selectedLocation.name || 'Selected Location'}
            description={selectedLocation.address}
            pinColor={colors.warning}
          />
        )}
      </MapView>

      {/* Search bar overlay */}
      <View style={styles.searchContainer}>
        <GooglePlacesAutocomplete
          placeholder="Search for a gym..."
          onPress={handlePlaceSelect}
          query={{
            key: GOOGLE_MAPS_API_KEY,
            language: 'en',
            types: 'gym|health|fitness',
          }}
          fetchDetails
          enablePoweredByContainer={false}
          styles={{
            container: styles.autocompleteContainer,
            textInputContainer: styles.textInputContainer,
            textInput: [styles.textInput, { color: colors.text }],
            listView: styles.listView,
            row: styles.row,
            description: { color: colors.text },
            separator: { backgroundColor: colors.border },
          }}
          textInputProps={{
            placeholderTextColor: colors.textMuted,
          }}
          nearbyPlacesAPI="GooglePlacesSearch"
          debounce={300}
        />
      </View>

      {/* Back button */}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backButtonText}>{'<'}</Text>
      </TouchableOpacity>

      {/* Center on me button */}
      <TouchableOpacity style={styles.centerButton} onPress={handleCenterOnMe}>
        <Text style={styles.centerButtonText}>📍</Text>
      </TouchableOpacity>

      {/* Bottom panel */}
      {selectedLocation && (
        <View style={styles.bottomPanel}>
          <View style={styles.selectedInfo}>
            <Text style={styles.selectedName}>
              {selectedLocation.name || 'Selected Location'}
            </Text>
            <Text style={styles.selectedAddress} numberOfLines={2}>
              {selectedLocation.address || 'Tap to select a different location'}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSaveGym}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color={colors.background} />
            ) : (
              <Text style={styles.saveButtonText}>Save Gym</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Instructions when no selection */}
      {!selectedLocation && (
        <View style={styles.instructionsPanel}>
          <Text style={styles.instructionsText}>
            Search for a gym above or tap on the map to select a location
          </Text>
        </View>
      )}
    </View>
  );
}

const createStyles = (Colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: Colors.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: Colors.background,
    },
    loadingText: {
      marginTop: Spacing.md,
      color: Colors.textSecondary,
      fontSize: Typography.fontSize.md,
    },
    map: {
      flex: 1,
    },
    searchContainer: {
      position: 'absolute',
      top: Platform.OS === 'ios' ? 60 : 40,
      left: 60,
      right: Spacing.md,
      zIndex: 1,
    },
    autocompleteContainer: {
      flex: 0,
    },
    textInputContainer: {
      backgroundColor: 'transparent',
    },
    textInput: {
      height: 48,
      borderRadius: BorderRadius.md,
      backgroundColor: Colors.surface,
      fontSize: Typography.fontSize.md,
      paddingHorizontal: Spacing.md,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
    },
    listView: {
      backgroundColor: Colors.surface,
      borderRadius: BorderRadius.md,
      marginTop: Spacing.xs,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
    },
    row: {
      backgroundColor: Colors.surface,
      padding: Spacing.md,
    },
    backButton: {
      position: 'absolute',
      top: Platform.OS === 'ios' ? 60 : 40,
      left: Spacing.md,
      width: 44,
      height: 48,
      borderRadius: BorderRadius.md,
      backgroundColor: Colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
    },
    backButtonText: {
      fontSize: 24,
      color: Colors.text,
      fontWeight: 'bold',
    },
    centerButton: {
      position: 'absolute',
      bottom: 180,
      right: Spacing.md,
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: Colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
    },
    centerButtonText: {
      fontSize: 24,
    },
    bottomPanel: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: Colors.surface,
      padding: Spacing.lg,
      paddingBottom: Platform.OS === 'ios' ? 40 : Spacing.lg,
      borderTopLeftRadius: BorderRadius.xl,
      borderTopRightRadius: BorderRadius.xl,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
    },
    selectedInfo: {
      marginBottom: Spacing.md,
    },
    selectedName: {
      fontSize: Typography.fontSize.lg,
      fontWeight: 'bold',
      color: Colors.text,
      marginBottom: 4,
    },
    selectedAddress: {
      fontSize: Typography.fontSize.sm,
      color: Colors.textSecondary,
    },
    saveButton: {
      backgroundColor: Colors.primary,
      paddingVertical: Spacing.md,
      borderRadius: BorderRadius.md,
      alignItems: 'center',
    },
    saveButtonDisabled: {
      opacity: 0.5,
    },
    saveButtonText: {
      color: Colors.background,
      fontSize: Typography.fontSize.md,
      fontWeight: 'bold',
    },
    instructionsPanel: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: Colors.surface,
      padding: Spacing.lg,
      paddingBottom: Platform.OS === 'ios' ? 40 : Spacing.lg,
      borderTopLeftRadius: BorderRadius.xl,
      borderTopRightRadius: BorderRadius.xl,
    },
    instructionsText: {
      fontSize: Typography.fontSize.md,
      color: Colors.textSecondary,
      textAlign: 'center',
    },
  });
