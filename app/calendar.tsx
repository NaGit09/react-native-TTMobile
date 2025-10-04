// app/calendar.tsx
import { Picker } from "@react-native-picker/picker";
import React, { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type Event = {
  time: string;
  title: string;
  duration: number; // số giờ
  color: string;
};

const eventColors = ["#A3BFFA", "#FBB6CE", "#C6F6D5", "#FDE68A"];


// ====== Hàm tiện ích ======
function generateDaysWholeYear() {
  const today = new Date();
  const startOfYear = new Date(today.getFullYear(), 0, 1);
  const endOfYear = new Date(today.getFullYear(), 11, 31);
  const days: Date[] = [];
  let current = new Date(startOfYear);
  while (current <= endOfYear) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  return days;
}

function formatDay(date: Date) {
  return date.toLocaleDateString("en-US", { weekday: "short", day: "numeric" });
}

function formatHeaderDate(date: Date) {
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Ho_Chi_Minh",
  });
}

// ====== Component chính ======
export default function Calendar() {
  const today = new Date();
  const [days, setDays] = useState<Date[]>([]);
  const [activeDay, setActiveDay] = useState<Date>(today);
  const scrollViewRef = useRef<ScrollView>(null);

  // ===== Modal state =====
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [eventTitleInput, setEventTitleInput] = useState("");
  const [eventDurationInput, setEventDurationInput] = useState(0);

  // ====== Base events ======
  const [events, setEvents] = useState<Event[]>(() => {
    const baseEvents: Omit<Event, "color">[] = [
      { time: "06:00", title: "Drink 8 glasses of water", duration: 1 },
      { time: "08:00", title: "Work", duration: 4 },
      { time: "12:00", title: "Take a nap", duration: 1 },
      { time: "13:00", title: "Work", duration: 4 },
      { time: "18:00", title: "Gym", duration: 2 },
      { time: "20:00", title: "Dinner", duration: 1 },
    ];
    return baseEvents.map((event, index) => ({
      ...event,
      color: eventColors[index % eventColors.length],
    }));
  });

  // Khi Confirm trong modal:
  const handleConfirm = () => {
    if (!selectedTime || !eventTitleInput || eventDurationInput <= 0) {
      setModalVisible(false);
      return;
    }

    setEvents((prevEvents) => {
      let updatedEvents: Event[];

      const exists = prevEvents.find((e) => e.time === selectedTime);

      if (exists) {
        // Cập nhật event cũ
        updatedEvents = prevEvents.map((e) =>
          e.time === selectedTime
            ? { ...e, title: eventTitleInput, duration: eventDurationInput }
            : e
        );
      } else {
        // Thêm event mới
        const newEvent: Event = {
          time: selectedTime,
          title: eventTitleInput,
          duration: eventDurationInput,
          color: "#fff", // tạm thời
        };
        updatedEvents = [...prevEvents, newEvent];
      }

      // Sắp xếp lại theo thứ tự thời gian
      updatedEvents.sort((a, b) => {
        const hourA = parseInt(a.time.split(":")[0]);
        const hourB = parseInt(b.time.split(":")[0]);
        return hourA - hourB;
      });

      // Cập nhật lại màu theo quy tắc tuần tự
      updatedEvents = updatedEvents.map((e, index) => ({
        ...e,
        color: eventColors[index % eventColors.length],
      }));

      return updatedEvents;
    });

    setModalVisible(false);
    setEventTitleInput("");
    setEventDurationInput(0);
  };

  useEffect(() => {
    const generatedDays = generateDaysWholeYear();
    setDays(generatedDays);
    setActiveDay(today);

    // scroll tới today
    setTimeout(() => {
      const todayIndex = generatedDays.findIndex(
        (d) => d.toDateString() === today.toDateString()
      );
      if (todayIndex !== -1 && scrollViewRef.current) {
        const screenWidth = Dimensions.get("window").width;
        const dayBoxWidth = 80;
        const marginRight = 8;
        const itemWidth = dayBoxWidth + marginRight;

        const offset = todayIndex * itemWidth - screenWidth / 2 + dayBoxWidth / 2;

        scrollViewRef.current.scrollTo({ x: offset > 0 ? offset : 0, animated: true });
      }
    }, 300);
  }, []);

  // ===== Render timeline =====
  const renderTimeline = () => {
    const rows = [];

    for (let i = 0; i < 18; i++) {
      const hour = i + 6;
      const formatted = `${hour < 10 ? "0" : ""}${hour}:00`;

      // Kiểm tra xem có event nào bắt đầu tại giờ này không
      const event = events.find((e) => e.time === formatted);

      if (event) {
        // Nếu có event bắt đầu tại đây → render eventBox với chiều cao = duration
        rows.push(
          <TouchableOpacity
            key={formatted}
            style={styles.timeRow}
            onPress={() => {
              setSelectedTime(formatted);
              setEventTitleInput(event.title);
              setEventDurationInput(event.duration);
              setModalVisible(true);
            }}
          >
            <Text style={styles.timeText}>{formatted}</Text>
            <View style={styles.eventContainer}>
              <View
                style={[
                  styles.eventBox,
                  {
                    backgroundColor: event.color,
                    minHeight: 60 * event.duration, // Chiều cao theo giờ
                  },
                ]}
              >
                <View style={styles.eventRow}>
                  <Text style={styles.eventTitle}>{event.title}</Text>
                  <Text style={styles.eventDuration}>{event.duration}h</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        );

        i += event.duration - 1;
      } else {
        // Nếu không có event → render timeRow trống
        rows.push(
          <TouchableOpacity
            key={formatted}
            style={styles.timeRow}
            onPress={() => {
              setSelectedTime(formatted);
              setEventTitleInput("");
              setEventDurationInput(0);
              setModalVisible(true);
            }}
          >
            <Text style={styles.timeText}>{formatted}</Text>
            <View style={styles.eventContainer} />
          </TouchableOpacity>
        );
      }
    }

    return rows;
  };

  // ===== Modal JSX =====
  const renderModal = () => (
    <Modal transparent visible={modalVisible} animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Close */}
          <TouchableOpacity
            style={styles.modalCloseBtn}
            onPress={() => setModalVisible(false)}
          >
            <Text style={{ fontSize: 24 }}>×</Text>
          </TouchableOpacity>

          {/* Time */}
          <Text style={styles.modalTimeText}>Time: {selectedTime}</Text>

          {/* Input */}
          <TextInput
            placeholder="Enter event title"
            style={styles.modalInput}
            value={eventTitleInput}
            onChangeText={setEventTitleInput}
          />

          {/* Picker */}
          <Picker
            selectedValue={eventDurationInput}
            onValueChange={(itemValue) => setEventDurationInput(itemValue)}
            style={styles.modalPicker}
          >
            {Array.from({ length: 9 }, (_, i) => (
              <Picker.Item key={i} label={i.toString()} value={i} />
            ))}
          </Picker>

          {/* Buttons */}
          <View style={styles.modalBtnRow}>
            <TouchableOpacity
              style={[styles.modalBtn, { backgroundColor: "#ddd" }]}
              onPress={() => {
                setEventTitleInput("");
                setEventDurationInput(0);
              }}
            >
              <Text>Reset</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalBtn, { backgroundColor: "#3B82F6" }]}
              onPress={handleConfirm} // <-- GỌI NGAY TẠI ĐÂY
            >
              <Text style={{ color: "#fff" }}>Confirm</Text>
            </TouchableOpacity>

          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Calendar</Text>
        <Text style={styles.headerDate}>{formatHeaderDate(activeDay)}</Text>
      </View>

      {/* Today */}
      <Text style={styles.todayText}>Today: {formatHeaderDate(today)}</Text>

      {/* Days row */}
      <View style={styles.daysRowWrapper}>
        <ScrollView
          ref={scrollViewRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.daysRowContent}
        >
          {days.map((day, i) => {
            const isActive = day.toDateString() === activeDay.toDateString();
            const isToday = day.toDateString() === today.toDateString();
            return (
              <TouchableOpacity
                key={i}
                onPress={() => setActiveDay(day)}
                style={[styles.dayBox, isToday && styles.todayBox, isActive && styles.activeDayBox]}
              >
                <Text style={[styles.dayText, isToday && styles.todayDayText, isActive && styles.activeDayText]}>
                  {formatDay(day)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Timeline */}
      <ScrollView style={styles.timeline}>{renderTimeline()}</ScrollView>

      {/* Modal */}
      {renderModal()}
    </View>
  );
}

// ====== Styles ======
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", paddingTop: 20 },
  header: { flexDirection: "row", alignItems: "baseline", paddingHorizontal: 20, marginBottom: 10 },
  headerTitle: { fontSize: 24, fontWeight: "bold", marginRight: 10 },
  headerDate: { fontSize: 20, color: "#666" },
  todayText: { fontSize: 14, color: "#3B82F6", fontWeight: "bold", marginLeft: 20, marginBottom: 10 },

  // Days row
  daysRowWrapper: { height: 100 },
  daysRowContent: { paddingHorizontal: 10 },
  dayBox: { width: 80, height: 80, borderRadius: 12, borderWidth: 1, borderColor: "#ddd", marginRight: 8, backgroundColor: "#fff", justifyContent: "center", alignItems: "center" },
  activeDayBox: { borderColor: "#000", backgroundColor: "#000" },
  todayBox: { borderColor: "#3B82F6", backgroundColor: "#DBEAFE" },
  dayText: { color: "#666", fontSize: 12, fontWeight: "400", textAlign: "center" },
  activeDayText: { color: "#fff", fontWeight: "bold" },
  todayDayText: { color: "#1E40AF", fontWeight: "bold" },

  // Timeline
  timeline: { marginTop: 20 },
  timeRow: { flexDirection: "row", alignItems: "stretch", minHeight: 60, borderBottomWidth: 1, borderColor: "#f0f0f0", paddingHorizontal: 10 },
  timeText: { width: 50, color: "#888", fontSize: 12, marginTop: 5 },
  eventContainer: { flex: 1, paddingLeft: 10, alignSelf: "stretch" },
  eventBox: { borderRadius: 12, padding: 10, flex: 1, justifyContent: "center" },
  eventRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  eventTitle: { fontWeight: "500" },
  eventDuration: { fontSize: 12, color: "#333" },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.3)", justifyContent: "center", alignItems: "center" },
  modalContent: { width: 300, backgroundColor: "#fff", borderRadius: 12, padding: 20, position: "relative" },
  modalCloseBtn: { position: "absolute", top: 10, right: 10 },
  modalTimeText: { fontWeight: "bold", marginBottom: 10 },
  modalInput: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 8, marginBottom: 10 },
  modalPicker: { height: 50, marginBottom: 10 },
  modalBtnRow: { flexDirection: "row", justifyContent: "space-between" },
  modalBtn: { flex: 1, padding: 10, borderRadius: 8, marginHorizontal: 5, alignItems: "center" },
});
