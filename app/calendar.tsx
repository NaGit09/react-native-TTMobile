// app/calendar.tsx
import React, { useEffect, useRef, useState } from "react";
import {
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

type Event = {
  time: string;
  title: string;
  duration: number; // đổi sang number, ví dụ 1, 2, 4
  color: string;
};

// ====== Base events ======
const baseEvents: Omit<Event, "color">[] = [
  { time: "06:00", title: "Drink 8 glasses of water", duration: 1 },
  { time: "08:00", title: "Work", duration: 4 },
  { time: "12:00", title: "Take a nap", duration: 1 },
  { time: "13:00", title: "Work", duration: 4 },
  { time: "18:00", title: "Gym", duration: 2 },
  { time: "20:00", title: "Dinner", duration: 1 },
];

const eventColors = ["#A3BFFA", "#FBB6CE", "#C6F6D5", "#FDE68A"];

// Map sự kiện + tự động gán màu
const events: Event[] = baseEvents.map((event, index) => ({
  ...event,
  color: eventColors[index % eventColors.length],
}));

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
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    day: "numeric",
  });
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

  useEffect(() => {
    const generatedDays = generateDaysWholeYear();
    setDays(generatedDays);
    setActiveDay(today);

    // canh giữa ngày hôm nay
    setTimeout(() => {
      const todayIndex = generatedDays.findIndex(
        (d) => d.toDateString() === today.toDateString()
      );
      if (todayIndex !== -1 && scrollViewRef.current) {
        const screenWidth = Dimensions.get("window").width;
        const dayBoxWidth = 80;
        const marginRight = 8;
        const itemWidth = dayBoxWidth + marginRight;

        const offset =
          todayIndex * itemWidth - screenWidth / 2 + dayBoxWidth / 2;

        scrollViewRef.current.scrollTo({
          x: offset > 0 ? offset : 0,
          animated: true,
        });
      }
    }, 300);
  }, []);

  // ====== Render timeline có xử lý duration ======
  const renderTimeline = () => {
    const rows = [];
    let skipUntilHour = -1;

    for (let i = 0; i < 18; i++) {
      const hour = i + 6; // từ 6h đến 23h
      const formatted = `${hour < 10 ? "0" : ""}${hour}:00`;

      if (hour < skipUntilHour) {
        continue; // skip vì trong duration event trước
      }

      const event = events.find((e) => e.time === formatted);

      if (event) {
        const durationHours = event.duration;
        skipUntilHour = hour + durationHours;

        rows.push(
          <View key={formatted} style={styles.timeRow}>
            <Text style={styles.timeText}>{formatted}</Text>
            <View style={styles.eventContainer}>
              <View
                style={[
                  styles.eventBox,
                  { backgroundColor: event.color, minHeight: 60 * durationHours },
                ]}
              >
                <View style={styles.eventRow}>
                  <Text style={styles.eventTitle}>{event.title}</Text>
                  <Text style={styles.eventDuration}>{event.duration}h</Text>
                </View>
              </View>
            </View>
          </View>
        );
      } else {
        rows.push(
          <View key={formatted} style={styles.timeRow}>
            <Text style={styles.timeText}>{formatted}</Text>
            <View style={styles.eventContainer} />
          </View>
        );
      }
    }

    return rows;
  };

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
                style={[
                  styles.dayBox,
                  isToday && styles.todayBox,
                  isActive && styles.activeDayBox,
                ]}
              >
                <Text
                  style={[
                    styles.dayText,
                    isToday && styles.todayDayText,
                    isActive && styles.activeDayText,
                  ]}
                >
                  {formatDay(day)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Timeline */}
      <ScrollView style={styles.timeline}>{renderTimeline()}</ScrollView>
    </View>
  );
}

// ====== Styles ======
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", paddingTop: 20 },
  header: {
    flexDirection: "row",
    alignItems: "baseline",
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  headerTitle: { fontSize: 24, fontWeight: "bold", marginRight: 10 },
  headerDate: { fontSize: 20, color: "#666" },
  todayText: {
    fontSize: 14,
    color: "#3B82F6",
    fontWeight: "bold",
    marginLeft: 20,
    marginBottom: 10,
  },

  // Days row
  daysRowWrapper: { height: 100 },
  daysRowContent: { paddingHorizontal: 10 },
  dayBox: {
    width: 80,
    height: 80,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    marginRight: 8,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  activeDayBox: { borderColor: "#000", backgroundColor: "#000" },
  todayBox: { borderColor: "#3B82F6", backgroundColor: "#DBEAFE" },
  dayText: { color: "#666", fontSize: 12, fontWeight: "400", textAlign: "center" },
  activeDayText: { color: "#fff", fontWeight: "bold" },
  todayDayText: { color: "#1E40AF", fontWeight: "bold" },

  // Timeline
  timeline: { marginTop: 20 },
  timeRow: {
    flexDirection: "row",
    alignItems: "stretch",
    minHeight: 60,
    borderBottomWidth: 1,
    borderColor: "#f0f0f0",
    paddingHorizontal: 10,
  },
  timeText: { width: 50, color: "#888", fontSize: 12, marginTop: 5 },
  eventContainer: { flex: 1, paddingLeft: 10, alignSelf: "stretch" },
  eventBox: {
    borderRadius: 12,
    padding: 10,
    flex: 1,
    justifyContent: "center",
  },
  eventRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  eventTitle: { fontWeight: "500" },
  eventDuration: { fontSize: 12, color: "#333" },
});
