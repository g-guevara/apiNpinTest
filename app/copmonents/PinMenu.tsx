import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  PanResponder,
  StyleSheet,
  Text,
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
  longPressPosition: { x: number, y: number } | null;
  onClose: () => void;
  onSelect: (item: PinMenuItem) => void;
  menuItems: PinMenuItem[];
  showDebug?: boolean; // Opcional: mostrar elementos de depuración
}

const PinMenu: React.FC<PinMenuProps> = ({
  longPressPosition,
  onClose,
  onSelect,
  menuItems,
  showDebug = false // Por defecto, no mostrar depuración
}) => {
  // Visibility is determined by whether we have a longPressPosition
  const visible = longPressPosition !== null;
  
  // Animation values
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const menuAnim = useRef(new Animated.Value(0)).current;
  
  // Estado para el ítem activo
  const [activeItemIndex, setActiveItemIndex] = useState<number | null>(null);
  
  // Estado para la depuración
  const [debugInfo, setDebugInfo] = useState({ 
    angle: 0, 
    adjAngle: 0, 
    distance: 0, 
    touchX: 0, 
    touchY: 0,
    phase: 'none',
  });
  
  // Almacenar la última posición de toque
  const lastTouch = useRef({ x: 0, y: 0 });

  // Calcular ítem activo basado en coordenadas de toque
  const calculateActiveItem = (touchX: number, touchY: number) => {
    // Calcular la distancia desde el centro
    const distance = Math.sqrt(touchX * touchX + touchY * touchY);
    
    // No activar ningún ítem si la distancia es muy pequeña
    if (distance < 20) {
      setActiveItemIndex(null);
      return null;
    }
    
    // Calcular ángulo desde el centro a la posición actual
    let angle = Math.atan2(touchY, touchX);
    
    // Convertir a rango positivo si es necesario
    if (angle < 0) angle += 2 * Math.PI;
    
    // Para semicírculo superior (π a 2π)
    // Si está en semicírculo inferior (0 a π), no seleccionar ningún ítem
    if (angle < Math.PI && angle >= 0) {
      setActiveItemIndex(null);
      return null;
    }
    
    // Ajustar ángulo para que esté en rango 0-π (π-2π se convierte en 0-π)
    const adjustedAngle = angle - Math.PI;
    
    // Calcular a qué ítem corresponde el ángulo
    const totalItems = menuItems.length;
    const anglePerItem = Math.PI / totalItems;
    
    // Calcular índice del ítem
    const itemIndex = Math.floor(adjustedAngle / anglePerItem);
    
    // Asegurar que el índice está dentro de los límites
    if (itemIndex >= 0 && itemIndex < totalItems) {
      // Feedback háptico ligero al cambiar selección
      if (activeItemIndex !== itemIndex) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      setActiveItemIndex(itemIndex);
      return itemIndex;
    } else {
      setActiveItemIndex(null);
      return null;
    }
  };

  // Crear PanResponder para manejar gestos
  const panResponder = useRef(
    PanResponder.create({
      // Interceptar todos los gestos
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderTerminationRequest: () => false,
      
      // Al tocar
      onPanResponderGrant: (evt) => {
        if (!visible || !longPressPosition) return;
        
        // Calcular posición relativa al centro del menú
        const touchX = evt.nativeEvent.pageX - longPressPosition.x;
        const touchY = evt.nativeEvent.pageY - longPressPosition.y;
        
        // Almacenar la última posición de toque
        lastTouch.current = { x: touchX, y: touchY };
        
        // Calcular ítem activo
        calculateActiveItem(touchX, touchY);
        
        // Actualizar depuración
        if (showDebug) {
          setDebugInfo({
            angle: Math.atan2(touchY, touchX) * 180 / Math.PI,
            adjAngle: 0,
            distance: Math.sqrt(touchX * touchX + touchY * touchY),
            touchX: touchX,
            touchY: touchY,
            phase: 'grant'
          });
        }
      },
      
      // Al arrastrar
      onPanResponderMove: (evt) => {
        if (!visible || !longPressPosition) return;
        
        // Calcular posición relativa al centro del menú
        const touchX = evt.nativeEvent.pageX - longPressPosition.x;
        const touchY = evt.nativeEvent.pageY - longPressPosition.y;
        
        // Almacenar la última posición de toque
        lastTouch.current = { x: touchX, y: touchY };
        
        // Calcular ítem activo
        calculateActiveItem(touchX, touchY);
        
        // Actualizar depuración
        if (showDebug) {
          const distance = Math.sqrt(touchX * touchX + touchY * touchY);
          let angle = Math.atan2(touchY, touchX);
          if (angle < 0) angle += 2 * Math.PI;
          
          setDebugInfo({
            angle: angle * 180 / Math.PI,
            adjAngle: (angle - Math.PI) * 180 / Math.PI,
            distance: distance,
            touchX: touchX,
            touchY: touchY,
            phase: 'move'
          });
        }
      },
      
      // Al soltar
      onPanResponderRelease: () => {
        if (!visible) return;
        
        // Si hay un ítem activo, seleccionarlo
        if (activeItemIndex !== null) {
          const selectedItem = menuItems[activeItemIndex];
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onSelect(selectedItem);
        }
        
        // Cerrar el menú
        onClose();
        
        // Resetear estado
        setActiveItemIndex(null);
      },
      
      // Si el gesto se cancela
      onPanResponderTerminate: () => {
        if (visible) {
          onClose();
          setActiveItemIndex(null);
        }
      }
    })
  ).current;

  // Configurar animaciones cuando cambia la visibilidad
  useEffect(() => {
    if (visible) {
      // Feedback háptico al abrir el menú
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      // Animar entrada
      Animated.parallel([
        Animated.timing(overlayAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true
        }),
        Animated.timing(menuAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true
        })
      ]).start();
      
      // Resetear estado
      setActiveItemIndex(null);
    } else {
      // Animar salida
      Animated.parallel([
        Animated.timing(overlayAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true
        }),
        Animated.timing(menuAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true
        })
      ]).start();
    }
  }, [visible]);

  // Calcular posiciones para los ítems del menú radial
  const getItemPosition = (index: number, totalItems: number) => {
    // Disponer ítems en semicírculo superior
    const radius = 80;
    const angleStep = Math.PI / totalItems;
    const startAngle = Math.PI; // Comenzar desde abajo (π radianes)
    
    const angle = startAngle + (index * angleStep);
    
    return {
      left: radius * Math.cos(angle),
      top: radius * Math.sin(angle)
    };
  };

  if (!visible || !longPressPosition) return null;

  return (
    <Animated.View 
      style={[
        styles.overlay,
        { opacity: overlayAnim }
      ]}
    >
      {/* Área táctil de pantalla completa con pan responder */}
      <View 
        style={StyleSheet.absoluteFill} 
        {...panResponder.panHandlers}
      />
      
      <View 
        style={[
          styles.menuContainer, 
          {
            left: longPressPosition.x, 
            top: longPressPosition.y 
          }
        ]}
      >
        {/* Panel de depuración - solo si showDebug es true */}
        {showDebug && (
          <View style={styles.debugPanel}>
            <Text style={styles.debugText}>
              Phase: {debugInfo.phase}{'\n'}
              Angle: {debugInfo.angle.toFixed(0)}°{'\n'}
              Adj Angle: {debugInfo.adjAngle.toFixed(0)}°{'\n'}
              Distance: {debugInfo.distance.toFixed(0)}px{'\n'}
              Touch: ({debugInfo.touchX.toFixed(0)}, {debugInfo.touchY.toFixed(0)}){'\n'}
              Active: {activeItemIndex !== null ? activeItemIndex : 'none'}{'\n'}
              Items: {menuItems.length}
            </Text>
          </View>
        )}
        
        {/* Centro del menú - punto de referencia (solo en modo debug) */}
        {showDebug && <View style={styles.centerPoint} />}
        
        {/* Punto que sigue al dedo (solo en modo debug) */}
        {showDebug && (
          <View style={[
            styles.touchPoint,
            {
              left: lastTouch.current.x,
              top: lastTouch.current.y
            }
          ]} />
        )}

        {/* Línea indicadora */}
        {activeItemIndex !== null && (
          <View style={styles.indicatorContainer}>
            <View 
              style={[
                styles.selectionIndicator,
                {
                  transform: [
                    { rotate: `${Math.PI + activeItemIndex * (Math.PI / menuItems.length)}rad` }
                  ]
                }
              ]} 
            />
          </View>
        )}
        
        {/* Ítems del menú */}
        {menuItems.map((item, index) => {
          const { left, top } = getItemPosition(index, menuItems.length);
          const isActive = activeItemIndex === index;
          
          return (
            <Animated.View
              key={item.id}
              style={[
                styles.menuItemContainer,
                {
                  transform: [
                    { translateX: left },
                    { translateY: top },
                    { scale: menuAnim }
                  ]
                }
              ]}
            >
              <View
                style={[
                  styles.menuItem,
                  { backgroundColor: item.color || '#ffffff' },
                  isActive && styles.activeMenuItem
                ]}
              >
                <Ionicons 
                  name={item.icon as any} 
                  size={24} 
                  color={isActive ? "#fff" : "#333"} 
                />
              </View>
              <Text style={[
                styles.menuItemLabel,
                isActive && styles.activeMenuItemLabel
              ]}>
                {item.name}
              </Text>
              
              {/* Índice del ítem para depuración (solo en modo debug) */}
              {showDebug && (
                <Text style={styles.itemIndex}>
                  {index}
                </Text>
              )}
            </Animated.View>
          );
        })}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    zIndex: 1000,
    elevation: 1000,
  },
  menuContainer: {
    position: 'absolute',
    width: 1,
    height: 1,
  },
  menuItemContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItem: {
    width: 55,
    height: 55,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  activeMenuItem: {
    backgroundColor: '#3498db',
    transform: [{ scale: 1.2 }],
  },
  menuItemLabel: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '500',
    color: 'white',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  activeMenuItemLabel: {
    fontWeight: '700',
    backgroundColor: 'rgba(52, 152, 219, 0.8)',
  },
  indicatorContainer: {
    position: 'absolute',
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -80,
    marginTop: -80,
  },
  selectionIndicator: {
    position: 'absolute',
    width: 80,
    height: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    left: 80,
    transformOrigin: 'left',
  },
  centerPoint: {
    position: 'absolute',
    width: 16,
    height: 16,
    backgroundColor: 'yellow',
    borderRadius: 8,
    left: -8,
    top: -8,
    zIndex: 1000,
  },
  touchPoint: {
    position: 'absolute',
    width: 16,
    height: 16,
    backgroundColor: 'red',
    borderRadius: 8,
    marginLeft: -8,
    marginTop: -8,
    zIndex: 1000,
  },
  debugPanel: {
    position: 'absolute',
    top: -160,
    left: -120,
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 10,
    borderRadius: 8,
    width: 240,
    zIndex: 1000,
  },
  debugText: {
    color: 'white',
    fontFamily: 'monospace',
    fontSize: 12,
  },
  itemIndex: {
    position: 'absolute',
    top: -15,
    color: 'white',
    fontSize: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 4,
    borderRadius: 10,
  }
});

export default PinMenu;