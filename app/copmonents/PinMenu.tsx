import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

// Define the menu item interface
export interface PinMenuItem {
  id: string;
  name: string;
  icon: string;
  color?: string;
}

interface PinMenuProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (item: PinMenuItem) => void;
  menuItems: PinMenuItem[];
  position: { x: number; y: number };
}

const PinMenu: React.FC<PinMenuProps> = ({
  visible,
  onClose,
  onSelect,
  menuItems,
  position
}) => {
  // Animation values
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const menuAnim = useRef(new Animated.Value(0)).current;
  
  // Track the currently active/highlighted menu item
  const [activeItemIndex, setActiveItemIndex] = useState<number | null>(null);
  
  // Track whether drag has started
  const [isDragging, setIsDragging] = useState(false);

  // Screen dimensions
  const { width, height } = Dimensions.get('window');

  // Calculate positions to ensure menu stays within screen bounds
  const adjustedPosition = {
    x: Math.min(Math.max(position.x, 100), width - 100),
    y: Math.min(Math.max(position.y, 100), height - 100)
  };

  // Set up pan responder for handling drags
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        // Initial touch - set as not dragging yet
        setIsDragging(false);
        setActiveItemIndex(null);
      },
      onPanResponderMove: (event, gestureState) => {
        // User is moving finger
        setIsDragging(true);
        
        // Calculate which item user is pointing to
        // We need to get distance from the center point
        const dx = gestureState.dx;
        const dy = gestureState.dy;
        
        // Don't activate any item if the drag distance is too small (within center area)
        const dragDistance = Math.sqrt(dx * dx + dy * dy);
        if (dragDistance < 30) {
          setActiveItemIndex(null);
          return;
        }
        
        // Calculate angle from center to current position
        let angle = Math.atan2(dy, dx);
        // Convert to positive range (0 to 2π)
        if (angle < 0) angle += 2 * Math.PI;
        
        // Map the angle to menu item index - for semicircle menu at the top
        // Adjust this for your specific menu layout
        const totalItems = menuItems.length;
        const anglePerItem = Math.PI / (totalItems - 1);
        
        // For semicircle at top (π to 0)
        // Need to convert angle from 0-2π to π-0 range for the top semicircle
        let adjustedAngle = angle;
        // If in bottom semicircle, don't select any item
        if (angle > Math.PI) {
          setActiveItemIndex(null);
          return;
        }
        
        // Map angle to item index in reverse (π = first item, 0 = last item)
        const itemIndex = Math.floor((Math.PI - adjustedAngle) / anglePerItem);
        
        // Ensure index is within bounds
        if (itemIndex >= 0 && itemIndex < totalItems) {
          // Provide light haptic feedback when changing selection
          if (activeItemIndex !== itemIndex) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
          setActiveItemIndex(itemIndex);
        } else {
          setActiveItemIndex(null);
        }
      },
      onPanResponderRelease: () => {
        // User lifted finger - select the active item if one is highlighted
        if (activeItemIndex !== null && isDragging) {
          const selectedItem = menuItems[activeItemIndex];
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onSelect(selectedItem);
        }
        onClose();
        
        // Reset state
        setIsDragging(false);
        setActiveItemIndex(null);
      },
      onPanResponderTerminate: () => {
        // Gesture was cancelled
        onClose();
        setIsDragging(false);
        setActiveItemIndex(null);
      },
    })
  ).current;

  useEffect(() => {
    if (visible) {
      // Provide haptic feedback when menu opens
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      // Animate in
      Animated.parallel([
        Animated.timing(overlayAnim, {
          toValue: 1,
          duration: 150, // Faster animation (was 200)
          useNativeDriver: true
        }),
        Animated.timing(menuAnim, {
          toValue: 1,
          duration: 200, // Faster animation (was 300)
          useNativeDriver: true
        })
      ]).start();
    } else {
      // Animate out
      Animated.parallel([
        Animated.timing(overlayAnim, {
          toValue: 0,
          duration: 150, // Faster animation (was 200)
          useNativeDriver: true
        }),
        Animated.timing(menuAnim, {
          toValue: 0,
          duration: 150, // Faster animation (was 200)
          useNativeDriver: true
        })
      ]).start();
    }
  }, [visible]);

  // Handle direct menu item press (for backwards compatibility)
  const handleMenuItemPress = (item: PinMenuItem) => {
    // Provide haptic feedback when menu item is selected
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelect(item);
    onClose();
  };

  // Calculate positions for radial menu items
  const getItemPosition = (index: number, totalItems: number) => {
    // Arrange items in a semicircle above the touch point
    const radius = 60; // Reduced distance from center (was 80)
    const angleStep = Math.PI / (totalItems - 1); // Distribute items in a semicircle
    const startAngle = Math.PI; // Start from bottom (PI radians)
    
    const angle = startAngle - (index * angleStep);
    
    return {
      left: radius * Math.cos(angle),
      top: radius * Math.sin(angle)
    };
  };

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <Animated.View 
        style={[
          styles.overlay,
          { opacity: overlayAnim }
        ]}
        {...panResponder.panHandlers}
      >
        <View 
          style={[
            styles.menuContainer, 
            { 
              left: adjustedPosition.x, 
              top: adjustedPosition.y 
            }
          ]}
        >
          {/* Draw a line from center to active item for visual feedback */}
          {activeItemIndex !== null && isDragging && (
            <View style={styles.indicatorContainer}>
              <View 
                style={[
                  styles.selectionIndicator,
                  {
                    transform: [
                      { rotate: `${Math.PI - activeItemIndex * (Math.PI / (menuItems.length - 1))}rad` }
                    ]
                  }
                ]} 
              />
            </View>
          )}
          
          {menuItems.map((item, index) => {
            const { left, top } = getItemPosition(index, menuItems.length);
            const isActive = activeItemIndex === index && isDragging;
            
            return (
              <Animated.View
                key={item.id}
                style={[
                  styles.menuItemContainer,
                  {
                    transform: [
                      { translateX: left },
                      { translateY: top },
                      { scale: menuAnim },
                      { perspective: 1000 }
                    ]
                  }
                ]}
              >
                <TouchableOpacity
                  style={[
                    styles.menuItem,
                    { backgroundColor: item.color || '#ffffff' },
                    isActive && styles.activeMenuItem
                  ]}
                  onPress={() => handleMenuItemPress(item)}
                >
                  <Ionicons 
                    name={item.icon as any} 
                    size={24} 
                    color={isActive ? "#fff" : "#333"} 
                  />
                </TouchableOpacity>
                <Text style={[
                  styles.menuItemLabel,
                  isActive && styles.activeMenuItemLabel
                ]}>
                  {item.name}
                </Text>
              </Animated.View>
            );
          })}
        </View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)', // Darker overlay (was 0.7 white)
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContainer: {
    position: 'absolute',
    width: 1,
    height: 1,
    // This is the anchor point for the radial menu
  },
  menuItemContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItem: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  activeMenuItem: {
    backgroundColor: '#3498db', // Highlight color when active
    transform: [{ scale: 1.2 }], // Slightly larger when active
  },
  menuItemLabel: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '500',
    color: 'white', // Changed from #333 to white for better visibility on dark overlay
    backgroundColor: 'rgba(0, 0, 0, 0.6)', // Darker background for label
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  activeMenuItemLabel: {
    fontWeight: '700',
    backgroundColor: 'rgba(52, 152, 219, 0.8)', // Matching highlight color
  },
  indicatorContainer: {
    position: 'absolute',
    width: 120, // Twice the radius
    height: 120, // Twice the radius
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -60, // Half of width
    marginTop: -60, // Half of height
  },
  selectionIndicator: {
    position: 'absolute',
    width: 60, // Same as radius
    height: 3, // Line thickness
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    left: 60, // Half of container width
    transformOrigin: 'left',
  }
});

export default PinMenu;