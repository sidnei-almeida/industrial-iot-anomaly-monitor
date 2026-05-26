import { VISIBLE_SENSOR_MAP } from "@/lib/constants";
import type { DatasetAnalytics, SecomRow, SensorColumnStats } from "@/types/secom";

function variance(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  return values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
}

function statsForColumn(rows: SecomRow[], columnIndex: number, name: string): SensorColumnStats {
  const values = rows.map((r) => r.features[columnIndex] ?? 0);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  return {
    columnIndex,
    name,
    min,
    max,
    mean,
    variance: variance(values),
  };
}

export function computeDatasetAnalytics(rows: SecomRow[]): DatasetAnalytics {
  const totalSamples = rows.length;
  const failureSamples = rows.filter((r) => r.passFail === 1).length;
  const normalSamples = totalSamples - failureSamples;
  const failureRate = totalSamples ? (failureSamples / totalSamples) * 100 : 0;

  const visibleSensorStats = VISIBLE_SENSOR_MAP.map((sensor) =>
    statsForColumn(rows, sensor.columnIndex, sensor.name),
  );

  const topUnstableSensors = [...visibleSensorStats]
    .sort((a, b) => b.variance - a.variance)
    .slice(0, 6);

  const failureRows = rows.filter((r) => r.passFail === 1);
  const meanFailureScoreProxy =
    failureRows.length > 0
      ? failureRows.reduce((sum, row) => {
          const avg =
            row.features.slice(0, 6).reduce((a, b) => a + b, 0) /
            Math.min(6, row.features.length);
          return sum + avg;
        }, 0) / failureRows.length
      : 0;

  return {
    totalSamples,
    featureCount: rows[0]?.features.length ?? 590,
    normalSamples,
    failureSamples,
    failureRate,
    missingValues: 0,
    visibleSensorStats,
    topUnstableSensors,
    meanFailureScoreProxy,
  };
}
