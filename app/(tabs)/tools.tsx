import React, { useState } from "react";
import { View, Text, TouchableOpacity, Modal, TextInput, StyleSheet } from "react-native";

export default function ToolsScreen() {
  const [visible, setVisible] = useState(false);
  const [minSalary, setMinSalary] = useState("7100");
  const [months, setMonths] = useState("1");
  const [result, setResult] = useState<number | null>(null);

  const calculateESV = () => {
    const salary = parseFloat(minSalary);
    const m = parseInt(months);
    if (!isNaN(salary) && !isNaN(m)) {
      setResult(salary * 0.22 * m);
    } else {
      setResult(null);
    }
  };

  return (
    <View style={styles.container}>
      {/* Кнопка калькулятора */}
      <TouchableOpacity style={styles.tile} onPress={() => setVisible(true)}>
        <Text style={styles.tileText}>ЄСВ для ФОП</Text>
      </TouchableOpacity>

      {/* Модалка */}
      <Modal visible={visible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.title}>Калькулятор ЄСВ</Text>

            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={minSalary}
              onChangeText={setMinSalary}
              placeholder="Мінімальна зарплата"
            />
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={months}
              onChangeText={setMonths}
              placeholder="Кількість місяців"
            />

            <TouchableOpacity style={styles.button} onPress={calculateESV}>
              <Text style={styles.buttonText}>Розрахувати</Text>
            </TouchableOpacity>

            {result !== null && (
              <Text style={styles.result}>Сума ЄСВ: {result.toFixed(2)} грн</Text>
            )}

            <TouchableOpacity onPress={() => setVisible(false)}>
              <Text style={styles.close}>Закрити</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f8f9fa" },
  tile: {
    backgroundColor: "#007AFF",
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 10,
  },
  tileText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    backgroundColor: "#fff",
    width: "85%",
    padding: 20,
    borderRadius: 16,
    elevation: 5,
  },
  title: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginVertical: 5,
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  buttonText: { color: "#fff", textAlign: "center", fontWeight: "600" },
  result: { marginTop: 10, fontSize: 16, fontWeight: "500" },
  close: {
    textAlign: "center",
    color: "#007AFF",
    marginTop: 15,
    fontSize: 16,
  },
});
