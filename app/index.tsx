import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Alert,
  Animated,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { Transaction, transactionData } from "./data/sampleData";

// Define the menu item interface
interface MenuItem {
  id: string;
  name: string;
  icon: string;
  color?: string;
}

export default function HomeScreen() {
  const router = useRouter();
  
  // Estado de la lista
  const [scrollEnabled, setScrollEnabled] = useState(true);
  
  // Estado del menú y transacción
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [activeItemIndex, setActiveItemIndex] = useState<number | null>(null);
  
  // Animaciones
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const menuAnim = useRef(new Animated.Value(0)).current;
  
  // Referencias para seguimiento de toques
  const touchRef = useRef({ 
    active: false,
    x: 0, 
    y: 0,
    startTime: 0
  });

  // Elementos del menú
  const menuItems: MenuItem[] = [
    {
      id: "cancel",
      name: "Cancel",
      icon: "close-circle",
      color: "#ffffff"
    },
    {
      id: "share",
      name: "Share",
      icon: "share-social",
      color: "#ffffff"
    },
    {
      id: "more",
      name: "More",
      icon: "ellipsis-horizontal",
      color: "#ffffff"
    }
  ];

  // Navegar a la pantalla de detalles
  const handleTransactionPress = (transaction: Transaction) => {
    router.push({
      pathname: "/details",
      params: { transactionId: transaction.id.toString() }
    });
  };

  // Calcular ítem activo basado en la posición del toque
  const calculateActiveItem = (touchX: number, touchY: number) => {
    // Calcular distancia desde el centro
    const distance = Math.sqrt(touchX * touchX + touchY * touchY);
    
    // No seleccionar nada si estamos muy cerca del centro
    if (distance < 20) {
      setActiveItemIndex(null);
      return;
    }
    
    // Calcular ángulo (en radianes)
    let angle = Math.atan2(touchY, touchX);
    
    // Convertir a rango positivo (0 a 2π)
    if (angle < 0) angle += 2 * Math.PI;
    
    // Solo permitir selección en el semicírculo superior (π a 2π)
    if (angle < Math.PI && angle >= 0) {
      setActiveItemIndex(null);
      return;
    }
    
    // Ajustar ángulo para mapear con los ítems del menú (0 a π)
    const adjustedAngle = angle - Math.PI;
    
    // Calcular índice del ítem
    const totalItems = menuItems.length;
    const anglePerItem = Math.PI / totalItems;
    const itemIndex = Math.floor(adjustedAngle / anglePerItem);
    
    // Verificar límites
    if (itemIndex >= 0 && itemIndex < totalItems) {
      // Feedback háptico al cambiar selección
      if (activeItemIndex !== itemIndex) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      setActiveItemIndex(itemIndex);
    } else {
      setActiveItemIndex(null);
    }
  };

  // Mostrar el menú
  const showMenu = (x: number, y: number, transaction: Transaction) => {
    setMenuPosition({ x, y });
    setSelectedTransaction(transaction);
    setMenuVisible(true);
    setScrollEnabled(false);
    
    // Feedback háptico
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
  };

  // Cerrar el menú
  const closeMenu = () => {
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
    ]).start(() => {
      // Al completar la animación
      setMenuVisible(false);
      setActiveItemIndex(null);
      
      // Re-habilitar scroll después de un pequeño delay
      setTimeout(() => {
        setScrollEnabled(true);
      }, 100);
    });
  };

  // Seleccionar ítem del menú
  const handleMenuSelect = (item: MenuItem) => {
    if (!selectedTransaction) return;

    switch (item.id) {
      case "share":
        Alert.alert("Share", `Sharing transaction: ${selectedTransaction.name}`);
        break;
      case "more":
        Alert.alert("More Options", `More options for: ${selectedTransaction.name}`, [
          { text: "Edit", onPress: () => Alert.alert("Edit", "Edit functionality would go here") },
          { text: "Delete", onPress: () => Alert.alert("Delete", "Delete functionality would go here") },
          { text: "Cancel", style: "cancel" }
        ]);
        break;
      case "cancel":
      default:
        // Solo cerrar el menú
        break;
    }
  };

  // Calcular posiciones para los ítems del menú
  const getItemPosition = (index: number, totalItems: number) => {
    const radius = 80;
    const angleStep = Math.PI / totalItems;
    const startAngle = Math.PI; // Comenzar desde la parte inferior
    
    const angle = startAngle + (index * angleStep);
    
    return {
      left: radius * Math.cos(angle),
      top: radius * Math.sin(angle)
    };
  };

  // Formatear moneda
  const formatCurrency = (amount: number) => {
    return "$" + amount.toFixed(2);
  };
  
  // Handlers para gestos directos
  const onTouchStart = (transaction: Transaction, e: any) => {
    const { pageX, pageY } = e.nativeEvent;
    touchRef.current = {
      active: true,
      x: pageX,
      y: pageY,
      startTime: Date.now()
    };
    
    // Establecer temporizador para activar el longPress
    setTimeout(() => {
      if (touchRef.current.active) {
        showMenu(pageX, pageY, transaction);
      }
    }, 300);
  };
  
  const onTouchMove = (e: any) => {
    if (!touchRef.current.active) return;
    
    if (menuVisible) {
      // Si el menú está visible, calcular la posición relativa
      const { pageX, pageY } = e.nativeEvent.touches[0];
      const relX = pageX - menuPosition.x;
      const relY = pageY - menuPosition.y;
      
      // Actualizar ítem activo
      calculateActiveItem(relX, relY);
    } else {
      // Si ha habido demasiado movimiento antes del longPress, cancelar
      const { pageX, pageY } = e.nativeEvent.touches[0];
      const deltaX = Math.abs(pageX - touchRef.current.x);
      const deltaY = Math.abs(pageY - touchRef.current.y);
      
      if (deltaX > 10 || deltaY > 10) {
        touchRef.current.active = false;
      }
    }
  };
  
  const onTouchEnd = () => {
    if (menuVisible && activeItemIndex !== null) {
      // Si hay un ítem seleccionado, activarlo
      handleMenuSelect(menuItems[activeItemIndex]);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    // Limpiar estado
    touchRef.current.active = false;
    
    // Cerrar menú si está abierto
    if (menuVisible) {
      closeMenu();
    }
  };

  // Renderizar cada transacción
  const renderItem = ({ item }: { item: Transaction }) => {
    return (
      <View 
        style={styles.transactionContainer}
        onTouchStart={(e) => onTouchStart(item, e)}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <TouchableOpacity
          style={styles.transactionCard}
          onPress={() => handleTransactionPress(item)}
          activeOpacity={0.7}
        >
          <View style={styles.leftContent}>
            <Text style={styles.transactionName}>{item.name}</Text>
            <Text style={styles.transactionCategory}>{item.category}</Text>
            <Text style={styles.transactionDate}>{item.date}</Text>
          </View>
          <View style={styles.rightContent}>
            <Text style={styles.transactionAmount}>
              {formatCurrency(item.mount)}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  // Calcular total de transacciones
  const totalAmount = transactionData.reduce((sum, item) => sum + item.mount, 0);

  return (
    <View style={styles.container}>
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Total Transactions</Text>
        <Text style={styles.summaryAmount}>{formatCurrency(totalAmount)}</Text>
        <Text style={styles.summaryCount}>{transactionData.length} transactions</Text>
      </View>
      
      <FlatList
        data={transactionData}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        scrollEnabled={scrollEnabled}
      />

      {/* Overlay del menú */}
      {menuVisible && (
        <Animated.View 
          style={[
            styles.overlay,
            { opacity: overlayAnim }
          ]}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <View 
            style={[
              styles.menuContainer, 
              {
                left: menuPosition.x, 
                top: menuPosition.y 
              }
            ]}
          >
            {/* Centro del menú */}
            <View style={styles.centerPoint} />
            
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
                  
                  {/* Índice del ítem para depuración */}
                  <Text style={styles.itemIndex}>
                    {index}
                  </Text>
                </Animated.View>
              );
            })}
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  summaryCard: {
    backgroundColor: "#3498db",
    padding: 20,
    margin: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
    marginBottom: 8,
  },
  summaryAmount: {
    fontSize: 32,
    fontWeight: "700",
    color: "white",
    marginBottom: 4,
  },
  summaryCount: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  transactionContainer: {
    marginBottom: 12,
  },
  transactionCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  leftContent: {
    flex: 1,
  },
  rightContent: {
    justifyContent: "center",
    alignItems: "flex-end",
  },
  transactionName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  transactionCategory: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
    color: "#888",
  },
  transactionAmount: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2ecc71",
  },
  
  // Estilos para el menú
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