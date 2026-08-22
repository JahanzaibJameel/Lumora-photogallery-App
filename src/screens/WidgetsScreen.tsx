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
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useTheme } from '../hooks/useTheme';
import { useWidgets, WidgetType } from '../hooks/useWidgets';
import { spacing, borderRadius, typography } from '../theme/tokens';
import { hexToRgba } from '../utils/helpers';

const WIDGET_ICONS: Record<WidgetType, string> = {
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
    const { colors } = useTheme();
    const reduceMotion = useReducedMotion();
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
                            style={[styles.infoIconContainer, { backgroundColor: hexToRgba(colors.accent, 0.12) }]}
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
                          entering={reduceMotion ? undefined : FadeInUp.delay(index * 100)}
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
                                         style={[styles.widgetIconContainer, { backgroundColor: hexToRgba(colors.accent, 0.12) }]}
                                     >
                                         <Ionicons
                                             name={WIDGET_ICONS[widget.type] as keyof typeof Ionicons.glyphMap}
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
                                         trackColor={{ false: colors.border, true: hexToRgba(colors.accent, 0.3) }}
                                         thumbColor={widget.enabled ? colors.accent : '#f4f3f4'}
                                         accessibilityLabel={`${widget.title} widget switch`}
                                         accessibilityHint={`${widget.enabled ? 'Disables' : 'Enables'} the ${widget.title} widget`}
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
                                         accessibilityRole="button"
                                         accessibilityLabel={`Refresh ${widget.title} widget`}
                                         accessibilityHint="Updates the widget preview data"
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
                    accessibilityRole="button"
                    accessibilityLabel="Refresh all widgets"
                    accessibilityHint="Updates all widget preview data"
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
                                     <Ionicons name={item.icon as keyof typeof Ionicons.glyphMap} size={24} color={colors.accent} />
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
        paddingHorizontal: spacing.xl,
        paddingTop: spacing.md,
        paddingBottom: spacing.md,
    },
    headerTitle: {
        ...typography.h1,
    },
    headerSubtitle: {
        ...typography.body,
        marginTop: spacing.xs,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: spacing.md,
    },
    infoCard: {
        marginHorizontal: spacing.sm,
        marginBottom: spacing.lg,
        padding: spacing.md,
        borderRadius: borderRadius.lg,
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
        marginLeft: spacing.sm,
    },
    infoTitle: {
        ...typography.title,
    },
    infoDescription: {
        ...typography.bodySmall,
        marginTop: spacing.xs,
    },
    widgetContainer: {
        marginHorizontal: spacing.sm,
        marginBottom: spacing.md,
    },
    widgetCard: {
        padding: spacing.md,
        borderRadius: borderRadius.lg,
    },
    widgetHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.md,
    },
    widgetHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    widgetIconContainer: {
        width: 48,
        height: 48,
        borderRadius: borderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    widgetTextContainer: {
        flex: 1,
        marginLeft: spacing.sm,
    },
    widgetTitle: {
        ...typography.title,
    },
    widgetDescription: {
        ...typography.bodySmall,
        marginTop: spacing.xs,
    },
    previewRow: {
        flexDirection: 'row',
    },
    previewBox: {
        borderRadius: borderRadius.lg,
        overflow: 'hidden',
    },
    previewContainer: {
        flex: 1,
        borderRadius: borderRadius.md,
        overflow: 'hidden',
    },
    previewEmpty: {
        flex: 1,
        borderRadius: borderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    previewEmptyText: {
        ...typography.bodySmall,
        marginTop: spacing.sm,
    },
    badge: {
        position: 'absolute',
        top: spacing.sm,
        right: spacing.sm,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.full,
    },
    badgeText: {
        color: 'white',
        ...typography.bodySmall,
        fontWeight: '600',
    },
    refreshButton: {
        marginLeft: spacing.sm,
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    lastUpdated: {
        ...typography.bodySmall,
        marginTop: spacing.sm,
    },
    refreshAllButton: {
        marginHorizontal: spacing.sm,
        marginBottom: spacing.lg,
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    refreshAllText: {
        color: 'white',
        ...typography.title,
        fontWeight: '600',
        marginLeft: spacing.sm,
    },
    sizeGuideCard: {
        marginHorizontal: spacing.sm,
        marginBottom: spacing.lg,
        padding: spacing.md,
        borderRadius: borderRadius.lg,
    },
    sizeGuideTitle: {
        ...typography.title,
        marginBottom: spacing.sm,
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
        borderRadius: borderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.sm,
    },
    sizeLabel: {
        ...typography.bodySmall,
        fontWeight: '600',
    },
    sizeDims: {
        ...typography.bodySmall,
    },
    bottomSpacer: {
        height: spacing.lg,
    },
});

export default WidgetsScreen;
