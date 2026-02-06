import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components";
import { GroupParticipant } from "@/store/groupWebRTCStore";

import { ParticipantTile } from "./ParticipantTile";

interface ParticipantGridProps {
  participants: Map<string, GroupParticipant>;
}

export const ParticipantGrid: React.FC<ParticipantGridProps> = ({
  participants,
}) => {
  const participantList = useMemo(
    () => Array.from(participants.values()),
    [participants],
  );

  const count = participantList.length;

  if (count === 0) {
    return (
      <View style={styles.emptyContainer}>
        <ThemedText style={styles.emptyText}>
          Waiting for participants...
        </ThemedText>
      </View>
    );
  }

  // 1-3 remote participants: vertical stack, each takes equal space
  if (count <= 3) {
    return (
      <View style={styles.container}>
        {participantList.map((participant) => (
          <View key={participant.username} style={styles.flexItem}>
            <ParticipantTile participant={participant} />
          </View>
        ))}
      </View>
    );
  }

  // 4+ remote participants: grid layout with rows
  const columns = count <= 4 ? 2 : count <= 9 ? 3 : 3;
  const rows = Math.ceil(count / columns);

  return (
    <View style={styles.container}>
      {Array.from({ length: rows }, (_, rowIndex) => {
        const rowParticipants = participantList.slice(
          rowIndex * columns,
          (rowIndex + 1) * columns,
        );
        return (
          <View key={rowIndex} style={styles.gridRow}>
            {rowParticipants.map((participant) => (
              <View key={participant.username} style={styles.flexItem}>
                <ParticipantTile participant={participant} />
              </View>
            ))}
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flexItem: {
    flex: 1,
  },
  gridRow: {
    flex: 1,
    flexDirection: "row",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 16,
  },
});
