import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useRef } from 'react';
import {
    Animated,
    Dimensions,
    Modal,
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

  // Screen dimensions
  const { width, height } = Dimensions.get('window');

  // Calculate positions to ensure menu stays within screen bounds
  const adjustedPosition = {
    x: Math.min(Math.max(position.x, 100), width - 100),
    y: Math.min(Math.max(position.y, 100), height - 100)
  };

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

  // Handle menu item selection
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
        onTouchEnd={onClose}
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
          {menuItems.map((item, index) => {
            const { left, top } = getItemPosition(index, menuItems.length);
            
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
                    { backgroundColor: item.color || '#ffffff' }
                  ]}
                  onPress={() => handleMenuItemPress(item)}
                >
                  <Ionicons name={item.icon as any} size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.menuItemLabel}>{item.name}</Text>
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
  menuItemLabel: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '500',
    color: 'white', // Changed from #333 to white for better visibility on dark overlay
    backgroundColor: 'rgba(0, 0, 0, 0.6)', // Darker background for label
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  }
});

export default PinMenu;
