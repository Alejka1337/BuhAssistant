import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import EsvCalculatorModal from '../../components/EsvCalculatorModal';
import SingleTaxGroup1Modal from '../../components/SingleTaxGroup1Modal';
import SingleTaxGroup2Modal from '../../components/SingleTaxGroup2Modal';
import SingleTaxGroup3Modal from '../../components/SingleTaxGroup3Modal';
import PdfoCalculatorModal from '../../components/PdfoCalculatorModal';
import MilitaryTaxModal from '../../components/MilitaryTaxModal';
import NetSalaryModal from '../../components/NetSalaryModal';
import TotalTaxLoadModal from '../../components/TotalTaxLoadModal';

const tools = [
  'ЄСВ для ФОП',
  'Єдиний податок 1 группа',
  'Єдиний податок 2 группа',
  'Єдиний податок 3 группа',
  'ПДФО',
  'Військовий збір',
  'Чиста зарплата',

];

export default function ToolsScreen() {
  const [esvModalVisible, setEsvModalVisible] = useState(false);
  const [singleTaxG1ModalVisible, setSingleTaxG1ModalVisible] = useState(false);
  const [singleTaxG2ModalVisible, setSingleTaxG2ModalVisible] = useState(false);
  const [singleTaxG3ModalVisible, setSingleTaxG3ModalVisible] = useState(false);
  const [pdfoModalVisible, setPdfoModalVisible] = useState(false);
  const [militaryTaxModalVisible, setMilitaryTaxModalVisible] = useState(false);
  const [netSalaryModalVisible, setNetSalaryModalVisible] = useState(false);
  const [totalTaxLoadModalVisible, setTotalTaxLoadModalVisible] = useState(false);

  const handleTilePress = (toolName: string) => {
    switch (toolName) {
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
      case 'ПДФО':
        setPdfoModalVisible(true);
        break;
      case 'Військовий збір':
        setMilitaryTaxModalVisible(true);
        break;
      case 'Чиста зарплата':
        setNetSalaryModalVisible(true);
        break;
      case 'Загальний податковий тягар':
        setTotalTaxLoadModalVisible(true);
        break;
      // Add other cases here for future calculators
      default:
        break;
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        <View style={styles.tilesContainer}>
          {tools.map((tool, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.tile}
              onPress={() => handleTilePress(tool)}
            >
              <Text style={styles.tileText}>{tool}</Text>
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
    backgroundColor: '#1a1d21',
  },
  tilesContainer: {
    padding: 20,
  },
  tile: {
    backgroundColor: '#2c3e50',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 15,
  },
  tileText: {
    color: '#ecf0f1',
    fontSize: 16,
    fontWeight: '600',
  },
});
