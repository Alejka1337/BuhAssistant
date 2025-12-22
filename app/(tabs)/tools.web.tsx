// app/(tabs)/tools.web.tsx - WEB VERSION
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import EsvCalculatorModal from '../../components/EsvCalculatorModal';
import SingleTaxGroup1Modal from '../../components/SingleTaxGroup1Modal';
import SingleTaxGroup2Modal from '../../components/SingleTaxGroup2Modal';
import SingleTaxGroup3Modal from '../../components/SingleTaxGroup3Modal';
import SingleTaxGroup4Modal from '../../components/SingleTaxGroup4Modal';
import PdfoCalculatorModal from '../../components/PdfoCalculatorModal';
import MilitaryTaxModal from '../../components/MilitaryTaxModal';
import NetSalaryModal from '../../components/NetSalaryModal';
import SickLeaveCalculatorModal from '../../components/SickLeaveCalculatorModal';
import MaternityLeaveCalculatorModal from '../../components/MaternityLeaveCalculatorModal';
import TotalTaxLoadModal from '../../components/TotalTaxLoadModal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Typography, Spacing, BorderRadius } from '@/constants/Theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useResponsive } from '../../utils/responsive';
import { useSEO } from '../../hooks/useSEO';
import { PAGE_METAS } from '../../utils/seo';

interface Tool {
  name: string;
  icon: string;
  iconFamily: 'MaterialIcons' | 'MaterialCommunityIcons';
}

const tools: Tool[] = [
  { name: 'Єдиний податок 1 группа', icon: 'store', iconFamily: 'MaterialIcons' },
  { name: 'Єдиний податок 2 группа', icon: 'business', iconFamily: 'MaterialIcons' },
  { name: 'Єдиний податок 3 группа', icon: 'domain', iconFamily: 'MaterialIcons' },
  { name: 'Єдиний податок 4 группа', icon: 'agriculture', iconFamily: 'MaterialIcons' },
  { name: 'ЄСВ для ФОП', icon: 'account-balance', iconFamily: 'MaterialIcons' },
  { name: 'ПДФО', icon: 'receipt-long', iconFamily: 'MaterialIcons' },
  { name: 'Військовий збір', icon: 'shield', iconFamily: 'MaterialIcons' },
  { name: 'Чиста зарплата', icon: 'account-cash', iconFamily: 'MaterialCommunityIcons' },
  { name: 'Калькулятор лікарняних', icon: 'local-hospital', iconFamily: 'MaterialIcons' },
  { name: 'Калькулятор декретних', icon: 'child-care', iconFamily: 'MaterialIcons' },
];

export default function ToolsScreen() {
  useSEO(PAGE_METAS.tools);
  
  const insets = useSafeAreaInsets();
  const { isDesktop } = useResponsive();
  const { colors } = useTheme();
  const [esvModalVisible, setEsvModalVisible] = useState(false);
  const [singleTaxG1ModalVisible, setSingleTaxG1ModalVisible] = useState(false);
  const [singleTaxG2ModalVisible, setSingleTaxG2ModalVisible] = useState(false);
  const [singleTaxG3ModalVisible, setSingleTaxG3ModalVisible] = useState(false);
  const [singleTaxG4ModalVisible, setSingleTaxG4ModalVisible] = useState(false);
  const [pdfoModalVisible, setPdfoModalVisible] = useState(false);
  const [militaryTaxModalVisible, setMilitaryTaxModalVisible] = useState(false);
  const [netSalaryModalVisible, setNetSalaryModalVisible] = useState(false);
  const [sickLeaveModalVisible, setSickLeaveModalVisible] = useState(false);
  const [maternityLeaveModalVisible, setMaternityLeaveModalVisible] = useState(false);
  const [totalTaxLoadModalVisible, setTotalTaxLoadModalVisible] = useState(false);

  const handleTilePress = (tool: Tool) => {
    switch (tool.name) {
      case 'ЄСВ для ФОП':
        setEsvModalVisible(true);
        break;
      case 'Єдиний податок 1 группа':
        setSingleTaxG1ModalVisible(true);
        break;
      case 'Єдиний податок 2 группа':
        setSingleTaxG2ModalVisible(true);
        break;
      case 'Єдиний податок 3 группа':
        setSingleTaxG3ModalVisible(true);
        break;
      case 'Єдиний податок 4 группа':
        setSingleTaxG4ModalVisible(true);
        break;
      case 'ПДФО':
        setPdfoModalVisible(true);
        break;
      case 'Військовий збір':
        setMilitaryTaxModalVisible(true);
        break;
      case 'Чиста зарплата':
        setNetSalaryModalVisible(true);
        break;
      case 'Калькулятор лікарняних':
        setSickLeaveModalVisible(true);
        break;
      case 'Калькулятор декретних':
        setMaternityLeaveModalVisible(true);
        break;
      case 'Загальний податковий тягар':
        setTotalTaxLoadModalVisible(true);
        break;
      default:
        break;
    }
  };

  const renderIcon = (tool: Tool) => {
    const iconSize = isDesktop ? 40 : 48;
    if (tool.iconFamily === 'MaterialCommunityIcons') {
      return <MaterialCommunityIcons name={tool.icon as any} size={iconSize} color={colors.primary} />;
    }
    return <MaterialIcons name={tool.icon as any} size={iconSize} color={colors.primary} />;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={[
        styles.scrollContent,
        { paddingBottom: insets.bottom + 16 },
        { paddingTop: insets.bottom + 16 }
      ]}>
        <View style={[styles.content, isDesktop && styles.desktopContent]}>
          {/* Заголовок для Desktop */}
          {isDesktop && (
            <Text style={[styles.pageTitle, { color: colors.textPrimary }]}>Інструменти</Text>
          )}

          <View style={[styles.tilesContainer, isDesktop && styles.tilesContainerDesktop]}>
            {tools.map((tool, index) => (
              <TouchableOpacity 
                key={index} 
                style={[styles.tile, { backgroundColor: colors.cardBackground }, isDesktop && styles.tileDesktop]}
                onPress={() => handleTilePress(tool)}
              >
                {renderIcon(tool)}
                <Text style={[styles.tileText, { color: colors.textPrimary }, isDesktop && styles.tileTextDesktop]}>{tool.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      <EsvCalculatorModal 
        visible={esvModalVisible}
        onClose={() => setEsvModalVisible(false)}
      />

      <SingleTaxGroup1Modal
        visible={singleTaxG1ModalVisible}
        onClose={() => setSingleTaxG1ModalVisible(false)}
      />

      <SingleTaxGroup2Modal
        visible={singleTaxG2ModalVisible}
        onClose={() => setSingleTaxG2ModalVisible(false)}
      />

      <SingleTaxGroup3Modal
        visible={singleTaxG3ModalVisible}
        onClose={() => setSingleTaxG3ModalVisible(false)}
      />

      <SingleTaxGroup4Modal
        visible={singleTaxG4ModalVisible}
        onClose={() => setSingleTaxG4ModalVisible(false)}
      />

      <PdfoCalculatorModal
        visible={pdfoModalVisible}
        onClose={() => setPdfoModalVisible(false)}
      />

      <MilitaryTaxModal
        visible={militaryTaxModalVisible}
        onClose={() => setMilitaryTaxModalVisible(false)}
      />

      <NetSalaryModal
        visible={netSalaryModalVisible}
        onClose={() => setNetSalaryModalVisible(false)}
      />

      <SickLeaveCalculatorModal
        visible={sickLeaveModalVisible}
        onClose={() => setSickLeaveModalVisible(false)}
      />

      <MaternityLeaveCalculatorModal
        visible={maternityLeaveModalVisible}
        onClose={() => setMaternityLeaveModalVisible(false)}
      />

      <TotalTaxLoadModal
        visible={totalTaxLoadModalVisible}
        onClose={() => setTotalTaxLoadModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
  },
  desktopContent: {
    maxWidth: 1440,
    marginHorizontal: 'auto' as any,
    paddingHorizontal: 32,
    width: '100%',
  },
  pageTitle: {
    ...Typography.h2,
    marginBottom: Spacing.lg,
    marginTop: Spacing.md,
  },
  tilesContainer: {
    padding: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  tilesContainerDesktop: {
    padding: 0,
    gap: 24,
    justifyContent: 'flex-start',
  },
  tile: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    padding: 16,
  },
  tileDesktop: {
    width: 'calc(25% - 18px)' as any,
    aspectRatio: 1.2,
    marginBottom: 0,
    padding: 20,
  },
  tileText: {
    fontSize: 17,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 12,
  },
  tileTextDesktop: {
    fontSize: 15,
    marginTop: 10,
  },
});

