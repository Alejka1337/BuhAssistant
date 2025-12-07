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
import { Colors } from '@/constants/Theme';

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
  const insets = useSafeAreaInsets();
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
    if (tool.iconFamily === 'MaterialCommunityIcons') {
      return <MaterialCommunityIcons name={tool.icon as any} size={48} color={Colors.primary} />;
    }
    return <MaterialIcons name={tool.icon as any} size={48} color={Colors.primary} />;
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}>
        <View style={styles.tilesContainer}>
          {tools.map((tool, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.tile}
              onPress={() => handleTilePress(tool)}
            >
              {renderIcon(tool)}
              <Text style={styles.tileText}>{tool.name}</Text>
            </TouchableOpacity>
          ))}
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
    backgroundColor: Colors.background,
  },
  tilesContainer: {
    padding: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  tile: {
    backgroundColor: Colors.cardBackground,
    width: '48%',
    aspectRatio: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    padding: 16,
  },
  tileText: {
    color: Colors.textPrimary,
    fontSize: 17,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 12,
  },
});
