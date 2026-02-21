import { Ionicons } from '@expo/vector-icons';
import { useCallback } from 'react';
import {
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import BlurHashImage from '../components/BlurHashImage';
import { useTheme } from '../hooks/useTheme';
import { useWidgets, WidgetType } from '../hooks/useWidgets';

const WIDGET_ICONS: Record<WidgetType, any> = {
    daily_memory: 'calendar-outline',
    random_photo: 'shuffle-outline',
    album_preview: 'images-outline',
    favorites: 'heart-outline',
};

const WIDGET_DESCRIPTIONS: Record<WidgetType, string> = {
    daily_memory: 'Shows photos from this day in previous years',
    random_photo: 'Displays a random photo from your library',
    album_preview: 'Preview photos from a specific album',
    favorites: 'Quick access to your favorite photos',
};

const WidgetsScreen = () => {
    const { colors, isDark } = useTheme();
    const {
        widgets,
        widgetData,
        loading,
        refreshWidget,
        refreshAllWidgets,
        toggleWidget,
    } = useWidgets();

    const handleRefresh = useCallback(async () => {
        await refreshAllWidgets();
    }, [refreshAllWidgets]);

    const renderWidgetPreview = (widgetId: string) => {
        const data = widgetData[widgetId];
        if (!data || data.photos.length === 0) {
            return (
                <View
                    style={[styles.previewEmpty, { backgroundColor: colors.surface }]}
                >
                    <Ionicons name="image-outline" size={32} color={colors.textSecondary} />
                    <Text style={[styles.previewEmptyText, { color: colors.textSecondary }]}>
                        No photos
                    </Text>
                </View>
            );
        }

        const photo = data.photos[0];
        return (
            <View style={styles.previewContainer}>
                <BlurHashImage
                    uri={photo.uri}
                    style={{ width: '100%', height: '100%' }}
                    contentFit="cover"
                />
                {data.photos.length > 1 && (
                    <View
                        style={[styles.badge, { backgroundColor: 'rgba(0,0,0,0.6)' }]}
                    >
                        <Text style={styles.badgeText}>
                            +{data.photos.length - 1}
                        </Text>
                    </View>
                )}
            </View>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={styles.header}>
                <Text
                    style={[styles.headerTitle, { color: colors.textPrimary }]}
                >
                    Widgets
                </Text>
                <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                    Configure your home screen widgets
                </Text>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl
                        refreshing={loading}
                        onRefresh={handleRefresh}
                        tintColor={colors.accent}
                        colors={[colors.accent]}
                    />
                }
            >
                {/* Info Card */}
                <View
                    style={[styles.infoCard, { backgroundColor: colors.surface }]}
                >
                    <View style={styles.infoCardContent}>
                        <View
                            style={[styles.infoIconContainer, { backgroundColor: colors.accent + '20' }]}
                        >
                            <Ionicons name="information-circle" size={20} color={colors.accent} />
                        </View>
                        <View style={styles.infoTextContainer}>
                            <Text
                                style={[styles.infoTitle, { color: colors.textPrimary }]}
                            >
                                How to add widgets
                            </Text>
                            <Text style={[styles.infoDescription, { color: colors.textSecondary }]}>
                                Long press your home screen → Tap the + button → Search for Lumora
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Widget List */}
                {widgets.map((widget, index) => (
                    <Animated.View
                        key={widget.id}
                        entering={FadeInUp.delay(index * 100)}
                        style={styles.widgetContainer}
                    >
                        <View
                            style={[
                                styles.widgetCard,
                                {
                                    backgroundColor: colors.surface,
                                    opacity: widget.enabled ? 1 : 0.6,
                                },
                            ]}
                        >
                            {/* Widget Header */}
                            <View style={styles.widgetHeader}>
                                <View style={styles.widgetHeaderLeft}>
                                    <View
                                        style={[styles.widgetIconContainer, { backgroundColor: colors.accent + '15' }]}
                                    >
                                        <Ionicons
                                            name={WIDGET_ICONS[widget.type]}
                                            size={24}
                                            color={colors.accent}
                                        />
                                    </View>
                                    <View style={styles.widgetTextContainer}>
                                        <Text
                                            style={[styles.widgetTitle, { color: colors.textPrimary }]}
                                        >
                                            {widget.title}
                                        </Text>
                                        <Text
                                            style={[styles.widgetDescription, { color: colors.textSecondary }]}
                                        >
                                            {WIDGET_DESCRIPTIONS[widget.type]}
                                        </Text>
                                    </View>
                                    <Switch
                                        value={widget.enabled}
                                        onValueChange={() => toggleWidget(widget.id)}
                                        trackColor={{ false: colors.border, true: colors.accent + '50' }}
                                        thumbColor={widget.enabled ? colors.accent : '#f4f3f4'}
                                    />
                                </View>
                            </View>

                            {/* Widget Preview */}
                            {widget.enabled && (
                                <View style={styles.previewRow}>
                                    <View
                                        style={[
                                            styles.previewBox,
                                            {
                                                width: widget.size === 'small' ? 100 : widget.size === 'large' ? 300 : 200,
                                                height: widget.size === 'small' ? 100 : widget.size === 'large' ? 300 : 200,
                                                backgroundColor: colors.background,
                                            },
                                        ]}
                                    >
                                        {renderWidgetPreview(widget.id)}
                                    </View>

                                    {/* Refresh Button */}
                                    <TouchableOpacity
                                        onPress={() => refreshWidget(widget.id)}
                                        style={[styles.refreshButton, { backgroundColor: colors.background }]}
                                    >
                                        <Ionicons name="refresh" size={18} color={colors.textSecondary} />
                                    </TouchableOpacity>
                                </View>
                            )}

                            {/* Last Updated */}
                            {widget.enabled && widgetData[widget.id] && (
                                <Text
                                    style={[styles.lastUpdated, { color: colors.textSecondary }]}
                                >
                                    Last updated: {new Date(widgetData[widget.id].updatedAt).toLocaleTimeString()}
                                </Text>
                            )}
                        </View>
                    </Animated.View>
                ))}

                {/* Refresh All Button */}
                <TouchableOpacity
                    onPress={handleRefresh}
                    style={[styles.refreshAllButton, { backgroundColor: colors.accent }]}
                >
                    <Ionicons name="refresh-circle" size={20} color="white" />
                    <Text style={styles.refreshAllText}>Refresh All Widgets</Text>
                </TouchableOpacity>

                {/* Widget Size Guide */}
                <View
                    style={[styles.sizeGuideCard, { backgroundColor: colors.surface }]}
                >
                    <Text
                        style={[styles.sizeGuideTitle, { color: colors.textPrimary }]}
                    >
                        Widget Sizes
                    </Text>
                    <View style={styles.sizeGuideRow}>
                        {[
                            { size: 'Small', dims: '1x1', icon: 'square' },
                            { size: 'Medium', dims: '2x1', icon: 'tablet-portrait-outline' },
                            { size: 'Large', dims: '2x2', icon: 'tablet-portrait' },
                        ].map((item) => (
                            <View key={item.size} style={styles.sizeItem}>
                                <View
                                    style={[styles.sizeIconContainer, { backgroundColor: colors.background }]}
                                >
                                    <Ionicons name={item.icon as any} size={24} color={colors.accent} />
                                </View>
                                <Text
                                    style={[styles.sizeLabel, { color: colors.textPrimary }]}
                                >
                                    {item.size}
                                </Text>
                                <Text style={[styles.sizeDims, { color: colors.textSecondary }]}>
                                    {item.dims}
                                </Text>
                            </View>
                        ))}
                    </View>
                </View>

                <View style={styles.bottomSpacer} />
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 16,
    },
    headerTitle: {
        fontSize: 30,
        fontWeight: 'bold',
    },
    headerSubtitle: {
        fontSize: 16,
        marginTop: 4,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 16,
    },
    infoCard: {
        marginHorizontal: 8,
        marginBottom: 24,
        padding: 16,
        borderRadius: 16,
    },
    infoCardContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    infoIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    infoTextContainer: {
        flex: 1,
        marginLeft: 12,
    },
    infoTitle: {
        fontSize: 14,
        fontWeight: '500',
    },
    infoDescription: {
        fontSize: 12,
        marginTop: 2,
    },
    widgetContainer: {
        marginHorizontal: 8,
        marginBottom: 16,
    },
    widgetCard: {
        padding: 16,
        borderRadius: 16,
    },
    widgetHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    widgetHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    widgetIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    widgetTextContainer: {
        flex: 1,
        marginLeft: 12,
    },
    widgetTitle: {
        fontSize: 16,
        fontWeight: '600',
    },
    widgetDescription: {
        fontSize: 12,
        marginTop: 2,
    },
    previewRow: {
        flexDirection: 'row',
    },
    previewBox: {
        borderRadius: 16,
        overflow: 'hidden',
    },
    previewContainer: {
        flex: 1,
        borderRadius: 12,
        overflow: 'hidden',
    },
    previewEmpty: {
        flex: 1,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    previewEmptyText: {
        fontSize: 12,
        marginTop: 8,
    },
    badge: {
        position: 'absolute',
        top: 8,
        right: 8,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 9999,
    },
    badgeText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '500',
    },
    refreshButton: {
        marginLeft: 12,
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    lastUpdated: {
        fontSize: 12,
        marginTop: 12,
    },
    refreshAllButton: {
        marginHorizontal: 8,
        marginBottom: 24,
        padding: 16,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    refreshAllText: {
        color: 'white',
        fontWeight: '600',
        marginLeft: 8,
    },
    sizeGuideCard: {
        marginHorizontal: 8,
        marginBottom: 24,
        padding: 16,
        borderRadius: 16,
    },
    sizeGuideTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 12,
    },
    sizeGuideRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    sizeItem: {
        alignItems: 'center',
    },
    sizeIconContainer: {
        width: 64,
        height: 64,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    sizeLabel: {
        fontSize: 12,
        fontWeight: '500',
    },
    sizeDims: {
        fontSize: 12,
    },
    bottomSpacer: {
        height: 32,
    },
});

export default WidgetsScreen;
