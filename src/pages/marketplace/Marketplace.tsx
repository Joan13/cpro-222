import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, SafeAreaView, Dimensions, Text, ScrollView, RefreshControl, StyleSheet } from 'react-native';
import axios from 'axios';
import { strings } from '../../lang/lang';
import { useAppDispatch, useAppSelector } from '../../store/app/hooks';
import AppActivityIndicator from '../../components/app/AppActivityIndicator';
import { remote_host } from '../../../GlobalVariables';
import MarketingItem from '../../components/lists/marketing/MarketingItem';
import CategoryItem from '../../components/lists/marketplace/CategoryItem';
import { TMarketing } from '../../types/types';
import { FlashList, type FlashListRef } from '@shopify/flash-list';
import EN from '../../lang/locales/en.json';
import MarketplaceItems, { MarketplaceItemsRef } from './components/MarketplaceItems';
import * as RootNavigation from '../../services/Navigation_ref';
import { setCategory } from '../../store/reducers/appSlice';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, interpolate, Extrapolate, interpolateColor } from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MARKETING_CAROUSEL_HEIGHT = (SCREEN_WIDTH * 3) / 4;

const Marketplace = () => {
  const theme = useAppSelector(state => state.app_theme);

  // Marketing carousel data
  const [marketingItems, setMarketingItems] = useState<TMarketing[]>([]);
  const [loadingMarketing, setLoadingMarketing] = useState<boolean>(false);
  const dispatch = useAppDispatch();

  // Auto-scroll carousel
  const carouselRef = useRef<FlashListRef<TMarketing> | null>(null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const scrollX = useSharedValue(0);

  // Fetch marketing like in Admin/Marketing.tsx
  const fetchMarketing = useCallback(() => {
    setLoadingMarketing(true);
    axios
      .post(remote_host + '/yambi/API/get_marketing')
      .then(res => {
        if (res.data?.success === '1') {
          setMarketingItems(res.data.marketing || []);
        }
      })
      .catch(() => {
        // silent fail for now
      })
      .finally(() => setLoadingMarketing(false));
  }, []);

  useEffect(() => {
    fetchMarketing();
  }, [fetchMarketing]);

  // Auto-advance every 5s
  useEffect(() => {
    if (!marketingItems?.length) return;
    const id = setInterval(() => {
      setCarouselIndex(prev => {
        const next = (prev + 1) % marketingItems.length;
        try {
          carouselRef.current?.scrollToIndex({ index: next, animated: true });
        } catch (_) { }
        return next;
      });
    }, 5000);
    return () => clearInterval(id);
  }, [marketingItems]);

  // Build categories from localized strings with EN fallback (ensures all 19 categories)
  type TCategory = { id: string; name: string };

  const categories: TCategory[] = useMemo(() => {
    const enRoot: any = (EN as any)?.items_categories || {};
    const locRoot: any = (strings as any)?.items_categories || {};
    const keys = Object.keys(enRoot);
    return keys.map(key => {
      const base = enRoot[key] || {};
      const local = locRoot[key] || {};
      return {
        id: base.id ?? key,
        name: local.name ?? base.name ?? key,
      } as TCategory;
    });
  }, [strings.getLanguage()]);

  // Arrange categories into 3-row columns for horizontal scroll
  const categoryColumns: TCategory[][] = useMemo(() => {
    const cols: TCategory[][] = [];
    for (let i = 0; i < categories.length; i += 2) {
      cols.push(categories.slice(i, i + 2));
    }
    return cols;
  }, [categories]);


  const PageIndicator = ({ index, primaryColor, borderColor }: { index: number; primaryColor: string; borderColor: string }) => {
    const animatedStyle = useAnimatedStyle(() => {
      const inputRange = [
        (index - 1) * SCREEN_WIDTH,
        index * SCREEN_WIDTH,
        (index + 1) * SCREEN_WIDTH,
      ];

      const widthOutput = interpolate(
        scrollX.value,
        inputRange,
        [8, 30, 8],
        Extrapolate.CLAMP
      );

      const opacityOutput = interpolate(
        scrollX.value,
        inputRange,
        [0.4, 1, 0.4],
        Extrapolate.CLAMP
      );

      const scaleOutput = interpolate(
        scrollX.value,
        inputRange,
        [0.8, 1, 0.8],
        Extrapolate.CLAMP
      );

      const backgroundColor = interpolateColor(
        scrollX.value,
        inputRange,
        [borderColor, primaryColor, borderColor]
      );

      return {
        width: withSpring(widthOutput, {
          damping: 15,
          stiffness: 100,
        }),
        opacity: withSpring(opacityOutput, {
          damping: 15,
          stiffness: 100,
        }),
        transform: [{ scale: withSpring(scaleOutput, {
          damping: 15,
          stiffness: 100,
        }) }],
        backgroundColor: backgroundColor,
      };
    });

    return (
      <Animated.View
        style={[
          {
            width: 8,
            height: 8,
            borderRadius: 4,
            marginHorizontal: 4,
          },
          animatedStyle
        ]}
      />
    );
  };

  const renderMarketingItem = ({ item, index }: { item: TMarketing; index: number }) => (
    <View style={{ width: SCREEN_WIDTH }}>
      <MarketingItem
        item={item}
        index={index}
        onPress={() => { }}
        onEdit={() => { }} />
    </View>
  );

  const renderCategoryColumn = ({ item, index }: { item: TCategory[]; index: number }) => (
    <View style={{ marginRight: 10 }}>
      {item.map((cat, idx) => (
        <View key={cat.id} style={{ marginBottom: idx < item.length - 1 ? 5 : 0 }}>
          <CategoryItem
            item={{ id: cat.id, name: cat.name }}
            index={index * 3 + idx}
            onPress={() => {
              dispatch(setCategory(cat.id));
              RootNavigation.navigate("CategoryItems");
            }}
            onEdit={() => { }}
          />
        </View>
      ))}
    </View>
  );

  const [refreshing, setRefreshing] = useState(false);
  const itemsRef = useRef<MarketplaceItemsRef>(null);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchMarketing();
    // refresh items list via child ref
    try { itemsRef.current?.refresh(); } catch (_) {}
    setRefreshing(false);
  }, [fetchMarketing]);

  return (
    <SafeAreaView style={{ backgroundColor: theme.colors.background, flex: 1, borderColor: theme.colors.border, borderTopWidth: 1 }}>
      <ScrollView style={{ flex: 1 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {/* Marketing carousel */}
        <View style={{ height: MARKETING_CAROUSEL_HEIGHT }}>
          {loadingMarketing ? (
            <AppActivityIndicator />
          ) : (
            <>
              <FlashList
                ref={carouselRef}
                data={marketingItems}
                keyExtractor={(it, i) => (it._id ?? String(i))}
                renderItem={renderMarketingItem}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                estimatedItemSize={MARKETING_CAROUSEL_HEIGHT}
                onScroll={(event) => {
                  scrollX.value = event.nativeEvent.contentOffset.x;
                }}
                scrollEventThrottle={16}
                onMomentumScrollEnd={ev => {
                  const idx = Math.round(ev.nativeEvent.contentOffset.x / SCREEN_WIDTH);
                  if (!Number.isNaN(idx) && idx >= 0 && idx < marketingItems.length) {
                    setCarouselIndex(idx);
                  }
                }}
              />
              {marketingItems.length > 1 && (
                <View style={{
                  position: 'absolute',
                  bottom: 10,
                  left: 0,
                  right: 0,
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                  {marketingItems.map((_, index) => (
                    <PageIndicator
                      key={index}
                      index={index}
                      primaryColor={theme.colors.high_color}
                      borderColor={theme.colors.border}
                    />
                  ))}
                </View>
              )}
            </>
          )}
        </View>

        {/* Categories: 2 rows, horizontal scroll */}
        <View style={{ marginTop: 15 }}>
          <FlashList
            data={categoryColumns}
            keyExtractor={(_, i) => String(i)}
            renderItem={renderCategoryColumn}
            horizontal
            estimatedItemSize={150}
            showsHorizontalScrollIndicator={false}
          />
        </View>
        
        <MarketplaceItems ref={itemsRef} />
      </ScrollView>
    </SafeAreaView>
  );
};

export default Marketplace;
