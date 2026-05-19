import React, { memo, useCallback, useEffect, useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Pressable, Image, Platform, Dimensions } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useAppDispatch, useAppSelector } from '../../store/app/hooks';
import { LegendList } from '@legendapp/list';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setEmoji } from '../../store/reducers/appSlice';

const Tab = createMaterialTopTabNavigator();
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const EMOJI_SIZE = 32;
const NUM_COLUMNS = Math.floor((SCREEN_WIDTH - 20) / (EMOJI_SIZE + 10));
const RECENT_EMOJIS_KEY = '@yambi_recent_emojis';
const MAX_RECENT_EMOJIS = 40;

// Import emoji lists
import animals_nature from '../../assets/emojis/EmojiLists/animals_nature.json';
import flags from '../../assets/emojis/EmojiLists/flags.json';
import food_drink from '../../assets/emojis/EmojiLists/food_drink.json';
import objectss from '../../assets/emojis/EmojiLists/objects.json';
import travel_places from '../../assets/emojis/EmojiLists/travel_places.json';
import activities from '../../assets/emojis/EmojiLists/activities.json';
import symbols from '../../assets/emojis/EmojiLists/symbols.json';
import smileys_emotion from '../../assets/emojis/EmojiLists/smileys_emotion';

// Process emoji data - JSON files have code as string, TS files have require() already
const processEmojiData = (data: any[]) => {
  return data.map(item => {
    // For JSON files, code is a string, so we'll use native emoji on iOS
    // On Android, we'll try to use the emoji unicode directly (React Native handles it)
    // If images are needed, they should be pre-processed like smileys_emotion.ts
    return {
      ...item,
      code: typeof item.code === 'string' ? item.code : item.code,
      // For JSON files, we don't have image paths, so we'll use native emojis
      // smileys_emotion.ts already has require() statements in item.code
    };
  });
};

// Process smileys_emotion (it's a TS file with require statements)
const processSmileysEmotion = (data: any[]) => {
  return data.map(item => ({
    ...item,
    // item.code already contains require() statement from the TS file
  }));
};

interface EmojiKeyboardProps {
  onEmojiPress?: (emoji: string) => void;
  height?: number;
}

const EmojiKeyboard = ({ onEmojiPress, height = 300 }: EmojiKeyboardProps) => {
  const app_theme = useAppSelector(state => state.app_theme);
  const dispatch = useAppDispatch();
  const [recentEmojis, setRecentEmojis] = useState<any[]>([]);

  // Load recent emojis from AsyncStorage
  useEffect(() => {
    console.log('EmojiKeyboard component mounted');
    loadRecentEmojis();
  }, []);

  const loadRecentEmojis = async () => {
    try {
      const stored = await AsyncStorage.getItem(RECENT_EMOJIS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setRecentEmojis(parsed);
      }
    } catch (error) {
      console.log('Error loading recent emojis:', error);
    }
  };

  const saveRecentEmoji = async (emoji: string, emojiData: any) => {
    try {
      const stored = await AsyncStorage.getItem(RECENT_EMOJIS_KEY);
      let recent: any[] = stored ? JSON.parse(stored) : [];
      
      // Remove if already exists
      recent = recent.filter(item => item.emoji !== emoji);
      
      // Add to beginning
      recent.unshift({
        emoji: emoji,
        ...emojiData,
      });
      
      // Limit to MAX_RECENT_EMOJIS
      recent = recent.slice(0, MAX_RECENT_EMOJIS);
      
      await AsyncStorage.setItem(RECENT_EMOJIS_KEY, JSON.stringify(recent));
      setRecentEmojis(recent);
    } catch (error) {
      console.log('Error saving recent emoji:', error);
    }
  };

  const handleEmojiPress = useCallback((emoji: string, emojiData: any) => {
    // Save to recent emojis
    saveRecentEmoji(emoji, emojiData);
    
    // Dispatch to Redux
    dispatch(setEmoji(emoji));
    
    // Call custom callback if provided
    if (onEmojiPress) {
      onEmojiPress(emoji);
    }
  }, [onEmojiPress, dispatch]);

  const EmojiItem = ({ item }: { item: any }) => {
    const isIOS = Platform.OS === 'ios';
    // Check if item.code is a require() statement (number) or a string
    const hasImage = typeof item.code === 'number' || (typeof item.code === 'object' && item.code !== null);
    // On Android, use images if available (from smileys_emotion.ts), otherwise use native emoji
    // On iOS, always use native emojis for consistency
    const showImage = !isIOS && hasImage;
    
    return (
      <Pressable
        style={({ pressed }) => [
          styles.emojiItem,
          pressed && styles.emojiItemPressed,
        ]}
        onPress={() => handleEmojiPress(item.emoji, item)}
      >
        {showImage && typeof item.code === 'number' ? (
          <Image
            source={item.code}
            style={styles.emojiImage}
            resizeMode="contain"
          />
        ) : (
          <Text style={styles.emojiText}>{item.emoji}</Text>
        )}
      </Pressable>
    );
  };

  const EmojiGrid = ({ data }: { data: any[] }) => {
    return (
      <LegendList
        data={data}
        renderItem={({ item }) => <EmojiItem item={item} />}
        numColumns={NUM_COLUMNS}
        contentContainerStyle={styles.gridContainer}
        keyExtractor={(item, index) => `${item.emoji}-${index}`}
        showsVerticalScrollIndicator={false}
      />
    );
  };

  // Recent Emojis Tab
  const RecentEmojis = () => {
    if (recentEmojis.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: app_theme.colors.gray }]}>
            No recent emojis
          </Text>
        </View>
      );
    }
    return <EmojiGrid data={recentEmojis} />;
  };

  // Smileys & Emotion Tab
  const SmileysEmotion = () => {
    const processed = processSmileysEmotion(smileys_emotion);
    return <EmojiGrid data={processed} />;
  };

  // People & Body Tab (using smileys_emotion for now, can be updated with proper data)
  const PeopleBody = () => {
    // For now, using smileys_emotion. You can add a separate people_body.json file later
    const processed = processSmileysEmotion(smileys_emotion);
    return <EmojiGrid data={processed} />;
  };

  // Animals & Nature Tab
  const AnimalsNature = () => {
    const processed = processEmojiData(animals_nature);
    return <EmojiGrid data={processed} />;
  };

  // Food & Drink Tab
  const FoodDrink = () => {
    const processed = processEmojiData(food_drink);
    return <EmojiGrid data={processed} />;
  };

  // Objects Tab
  const Objects = () => {
    const processed = processEmojiData(objectss);
    return <EmojiGrid data={processed} />;
  };

  // Activities Tab
  const Activities = () => {
    const processed = processEmojiData(activities);
    return <EmojiGrid data={processed} />;
  };

  // Travel & Places Tab
  const TravelPlaces = () => {
    const processed = processEmojiData(travel_places);
    return <EmojiGrid data={processed} />;
  };

  // Symbols Tab
  const Symbols = () => {
    const processed = processEmojiData(symbols);
    return <EmojiGrid data={processed} />;
  };

  // Flags Tab
  const Flags = () => {
    const processed = processEmojiData(flags);
    return <EmojiGrid data={processed} />;
  };

  return (
    <View style={[styles.container, { backgroundColor: app_theme.colors.background, height, minHeight: height }]}>
      <NavigationContainer>
        <Tab.Navigator
        id="EmojiKeyboardTabs"
        tabBarPosition="bottom"
        screenOptions={{
          tabBarStyle: {
            backgroundColor: app_theme.colors.background,
            elevation: 0,
            height: 45,
            borderTopWidth: 1,
            borderTopColor: app_theme.colors.border,
          },
          tabBarActiveTintColor: app_theme.colors.primary,
          tabBarInactiveTintColor: app_theme.colors.gray,
          swipeEnabled: true,
          tabBarShowLabel: false,
          tabBarIndicatorStyle: {
            backgroundColor: app_theme.colors.primary,
            height: 3,
            borderRadius: 2,
          },
          tabBarScrollEnabled: true,
        }}
      >
        <Tab.Screen
          name="Recent"
          component={RecentEmojis}
          options={{
            tabBarIcon: ({ focused, color }) => (
              <Image
                source={require('../../assets/emojis/EmojiData/img-apple-64/1f600.png')}
                style={[styles.tabIcon, { opacity: focused ? 1 : 0.5 }]}
              />
            ),
          }}
        />
        <Tab.Screen
          name="Smileys"
          component={SmileysEmotion}
          options={{
            tabBarIcon: ({ focused, color }) => (
              <Image
                source={require('../../assets/emojis/EmojiData/img-apple-64/1f600.png')}
                style={[styles.tabIcon, { opacity: focused ? 1 : 0.5 }]}
              />
            ),
          }}
        />
        <Tab.Screen
          name="People"
          component={PeopleBody}
          options={{
            tabBarIcon: ({ focused, color }) => (
              <Image
                source={require('../../assets/emojis/EmojiData/img-apple-64/1f468.png')}
                style={[styles.tabIcon, { opacity: focused ? 1 : 0.5 }]}
              />
            ),
          }}
        />
        <Tab.Screen
          name="Animals"
          component={AnimalsNature}
          options={{
            tabBarIcon: ({ focused, color }) => (
              <Image
                source={require('../../assets/emojis/EmojiData/img-apple-64/1f435.png')}
                style={[styles.tabIcon, { opacity: focused ? 1 : 0.5 }]}
              />
            ),
          }}
        />
        <Tab.Screen
          name="Food"
          component={FoodDrink}
          options={{
            tabBarIcon: ({ focused, color }) => (
              <Image
                source={require('../../assets/emojis/EmojiData/img-apple-64/1f354.png')}
                style={[styles.tabIcon, { opacity: focused ? 1 : 0.5 }]}
              />
            ),
          }}
        />
        <Tab.Screen
          name="Objects"
          component={Objects}
          options={{
            tabBarIcon: ({ focused, color }) => (
              <Image
                source={require('../../assets/emojis/EmojiData/img-apple-64/26bd.png')}
                style={[styles.tabIcon, { opacity: focused ? 1 : 0.5 }]}
              />
            ),
          }}
        />
        <Tab.Screen
          name="Activities"
          component={Activities}
          options={{
            tabBarIcon: ({ focused, color }) => (
              <Image
                source={require('../../assets/emojis/EmojiData/img-apple-64/1f3c0.png')}
                style={[styles.tabIcon, { opacity: focused ? 1 : 0.5 }]}
              />
            ),
          }}
        />
        <Tab.Screen
          name="Travel"
          component={TravelPlaces}
          options={{
            tabBarIcon: ({ focused, color }) => (
              <Image
                source={require('../../assets/emojis/EmojiData/img-apple-64/1f698.png')}
                style={[styles.tabIcon, { opacity: focused ? 1 : 0.5 }]}
              />
            ),
          }}
        />
        <Tab.Screen
          name="Symbols"
          component={Symbols}
          options={{
            tabBarIcon: ({ focused, color }) => (
              <Image
                source={require('../../assets/emojis/EmojiData/img-apple-64/1f523.png')}
                style={[styles.tabIcon, { opacity: focused ? 1 : 0.5 }]}
              />
            ),
          }}
        />
        <Tab.Screen
          name="Flags"
          component={Flags}
          options={{
            tabBarIcon: ({ focused, color }) => (
              <Image
                source={require('../../assets/emojis/EmojiData/img-apple-64/1f1e8-1f1e9.png')}
                style={[styles.tabIcon, { opacity: focused ? 1 : 0.5 }]}
              />
            ),
          }}
        />
      </Tab.Navigator>
      </NavigationContainer>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    minHeight: 300,
  },
  gridContainer: {
    padding: 10,
  },
  emojiItem: {
    width: EMOJI_SIZE + 10,
    height: EMOJI_SIZE + 10,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 2,
    borderRadius: 8,
  },
  emojiItemPressed: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  emojiImage: {
    width: EMOJI_SIZE,
    height: EMOJI_SIZE,
  },
  emojiText: {
    fontSize: EMOJI_SIZE - 4,
  },
  tabIcon: {
    width: 24,
    height: 24,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
  },
});

export default memo(EmojiKeyboard);

