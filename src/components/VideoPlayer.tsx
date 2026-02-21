import { Ionicons } from '@expo/vector-icons';
import { ResizeMode, Video } from 'expo-av';
import React, { useCallback, useRef, useState } from 'react';
import {
    Dimensions,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';
import { useTheme } from '../hooks/useTheme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface VideoPlayerProps {
    uri: string;
    thumbnailUri?: string;
    onClose?: () => void;
    autoPlay?: boolean;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
    uri,
    thumbnailUri,
    onClose,
    autoPlay = false,
}) => {
    const videoRef = useRef<Video>(null);
    const { colors } = useTheme();
    
    const [status, setStatus] = useState<any>({});
    const [isLoading, setIsLoading] = useState(true);
    const [showControls, setShowControls] = useState(true);
    
    const controlsOpacity = useSharedValue(1);

    const togglePlayPause = useCallback(async () => {
        if (videoRef.current) {
            if (status.isPlaying) {
                await videoRef.current.pauseAsync();
            } else {
                await videoRef.current.playAsync();
            }
        }
    }, [status.isPlaying]);

    const toggleControls = useCallback(() => {
        setShowControls(prev => !prev);
        controlsOpacity.value = withSpring(showControls ? 0 : 1);
    }, [showControls, controlsOpacity]);

    const controlsStyle = useAnimatedStyle(() => ({
        opacity: controlsOpacity.value,
    }));

    const formatTime = (milliseconds: number): string => {
        const totalSeconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity
                activeOpacity={1}
                onPress={toggleControls}
                style={styles.videoContainer}
            >
                <Video
                    ref={videoRef}
                    source={{ uri }}
                    style={styles.video}
                    resizeMode={ResizeMode.CONTAIN}
                    isLooping
                    shouldPlay={autoPlay}
                    onLoadStart={() => setIsLoading(true)}
                    onLoad={() => setIsLoading(false)}
                    onPlaybackStatusUpdate={setStatus}
                    useNativeControls={false}
                    posterSource={thumbnailUri ? { uri: thumbnailUri } : undefined}
                    posterStyle={styles.poster}
                />

                {/* Loading Indicator */}
                {isLoading && (
                    <View style={styles.loadingContainer}>
                        <View style={[styles.spinner, { borderColor: colors.accent }]} />
                    </View>
                )}

                {/* Play/Pause Overlay */}
                {!isLoading && showControls && (
                    <Animated.View style={[styles.controlsOverlay, controlsStyle]}>
                        <TouchableOpacity
                            onPress={togglePlayPause}
                            style={[styles.playButton, { backgroundColor: colors.accent }]}
                        >
                            <Ionicons
                                name={status.isPlaying ? 'pause' : 'play'}
                                size={32}
                                color="white"
                            />
                        </TouchableOpacity>
                    </Animated.View>
                )}

                {/* Progress Bar */}
                {showControls && status.durationMillis && (
                    <Animated.View
                        style={[
                            styles.progressContainer,
                            controlsStyle,
                            { backgroundColor: 'rgba(0,0,0,0.5)' },
                        ]}
                    >
                        <View style={styles.progressBar}>
                            <View
                                style={[
                                    styles.progressFill,
                                    {
                                        width: `${(status.positionMillis / status.durationMillis) * 100}%`,
                                        backgroundColor: colors.accent,
                                    },
                                ]}
                            />
                        </View>
                        <View style={styles.timeContainer}>
                            <Text style={styles.timeText}>
                                {formatTime(status.positionMillis || 0)}
                            </Text>
                            <Text style={styles.timeText}>
                                {formatTime(status.durationMillis || 0)}
                            </Text>
                        </View>
                    </Animated.View>
                )}
            </TouchableOpacity>

            {/* Close Button */}
            {onClose && (
                <TouchableOpacity
                    onPress={onClose}
                    style={[styles.closeButton, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
                >
                    <Ionicons name="close" size={24} color="white" />
                </TouchableOpacity>
            )}
        </View>
    );
};

// Text component for video player
const Text = ({ style, children }: { style?: any; children: React.ReactNode }) => {
    const { colors } = useTheme();
    return (
        <Animated.Text style={[{ color: colors.textPrimary }, style]}>
            {children}
        </Animated.Text>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
    },
    videoContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    video: {
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
    },
    poster: {
        resizeMode: 'contain',
    },
    loadingContainer: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
    },
    spinner: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 3,
        borderTopColor: 'transparent',
    },
    controlsOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    playButton: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    progressContainer: {
        position: 'absolute',
        bottom: 40,
        left: 20,
        right: 20,
        padding: 12,
        borderRadius: 8,
    },
    progressBar: {
        height: 4,
        backgroundColor: 'rgba(255,255,255,0.3)',
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 2,
    },
    timeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    timeText: {
        color: 'white',
        fontSize: 12,
    },
    closeButton: {
        position: 'absolute',
        top: 50,
        left: 20,
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default VideoPlayer;
