import DateTimePicker from "@react-native-community/datetimepicker";
import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

interface DeliverySchedulerProps {
  onDateTimeChange: (date: Date) => void;
  initialDate?: Date;
}

const DeliveryScheduler: React.FC<DeliverySchedulerProps> = ({
  onDateTimeChange,
  initialDate,
}) => {
  const getNextAvailableWeekend = () => {
    const today = new Date();
    const day = today.getDay(); // 0 = Sunday, 6 = Saturday

    let startFrom = new Date(today);
    startFrom.setHours(0, 0, 0, 0);

    // If today is Friday (5), Saturday (6), or Sunday (0), shift to next weekend
    if (day >= 5 || day === 0) {
      const daysToNextSaturday = (13 - day) % 7 || 7; // Next Saturday
      startFrom.setDate(today.getDate() + daysToNextSaturday);
    } else {
      // Otherwise this week's weekend
      const daysToSaturday = (6 - day) % 7;
      startFrom.setDate(today.getDate() + daysToSaturday);
    }

    const saturday = new Date(startFrom);
    const sunday = new Date(startFrom);
    sunday.setDate(saturday.getDate() + 1);

    return [saturday, sunday];
  };

  const getValidWeekendDate = (selectedDate: Date) => {
    const selectedDay = selectedDate.getDay(); // 0 = Sunday, 6 = Saturday
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const selected = new Date(selectedDate);
    selected.setHours(0, 0, 0, 0);

    const isWeekend = selectedDay === 0 || selectedDay === 6;
    const isFuture = selected.getTime() >= now.getTime();

    return isWeekend && isFuture;
  };

  const [date, setDate] = useState(() => {
    if (initialDate) return initialDate;

    return getNextAvailableWeekend()[0]; // Default to Saturday
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const onDateChange = (event: any, selectedDate: any) => {
    setShowDatePicker(false);
    if (!selectedDate) return;

    if (!getValidWeekendDate(selectedDate)) {
      Alert.alert("Invalid Date", "Please select Saturday or Sunday only.");
      return;
    }

    const updated = new Date(date);
    updated.setFullYear(selectedDate.getFullYear());
    updated.setMonth(selectedDate.getMonth());
    updated.setDate(selectedDate.getDate());
    setDate(updated);
    onDateTimeChange(updated);
  };

  const onTimeChange = (event: any, selectedTime: any) => {
    setShowTimePicker(false);
    if (selectedTime) {
      const hour = selectedTime.getHours();
      const minute = selectedTime.getMinutes();

      if (hour < 9 || hour > 22 || (hour === 22 && minute > 0)) {
        Alert.alert(
          "Invalid Time",
          "Please select a time between 9:00 AM and 10:00 PM."
        );
        return;
      }

      const updated = new Date(date);
      updated.setHours(selectedTime.getHours());
      updated.setMinutes(selectedTime.getMinutes());
      setDate(updated);
      onDateTimeChange(updated);
    }
  };

  return (
    <View>
      <Text style={styles.title}>Select delivery date and time:</Text>

      {/* Date and Time Pickers in a Row */}
      <View style={styles.row}>
        <Pressable
          onPress={() => setShowDatePicker(true)}
          style={styles.dateTimeInput}
        >
          <Text style={styles.inputText}>📅 {date.toDateString()}</Text>
        </Pressable>

        <Pressable
          onPress={() => setShowTimePicker(true)}
          style={styles.dateTimeInput}
        >
          <Text style={styles.inputText}>
            🕒{" "}
            {date.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </Pressable>
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          onChange={onDateChange}
          minimumDate={getNextAvailableWeekend()[0]}
        />
      )}
      {showTimePicker && (
        <DateTimePicker
          value={date}
          mode="time"
          display="default"
          onChange={onTimeChange}
        />
      )}
    </View>
  );
};

export default DeliveryScheduler;

const styles = StyleSheet.create({
  title: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 4,
  },
  dateTimeInput: {
    flex: 1,
    padding: 12,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  inputText: {
    fontSize: 16,
    color: "#333",
  },
});
