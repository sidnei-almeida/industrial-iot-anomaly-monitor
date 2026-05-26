import Papa from "papaparse";

import { CSV_FEATURE_COUNT } from "@/lib/constants";
import type { DatasetMeta, GroundTruthLabel, PassFailLabel, SecomRow } from "@/types/secom";

function parsePassFail(value: string): PassFailLabel {
  const parsed = Number(value.trim());
  if (parsed === 1) return 1;
  return -1;
}

function toGroundTruth(passFail: PassFailLabel): GroundTruthLabel {
  return passFail === 1 ? "Failure" : "Normal";
}

export async function loadSecomDataset(path: string): Promise<{
  rows: SecomRow[];
  meta: DatasetMeta;
}> {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Failed to load dataset (${response.status})`);
  }

  const csvText = await response.text();

  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(csvText, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const rows: SecomRow[] = [];

          results.data.forEach((record, index) => {
            const time = record.Time?.trim();
            if (!time) return;

            const features: number[] = [];
            for (let i = 0; i < CSV_FEATURE_COUNT; i += 1) {
              const raw = record[String(i)];
              const parsed = Number(raw);
              features.push(Number.isFinite(parsed) ? parsed : 0);
            }

            const passFail = parsePassFail(record["Pass/Fail"] ?? "-1");
            rows.push({
              rowIndex: index,
              originalTime: time,
              features,
              passFail,
              groundTruthLabel: toGroundTruth(passFail),
            });
          });

          const failureRows = rows.filter((row) => row.passFail === 1).length;

          resolve({
            rows,
            meta: {
              totalRows: rows.length,
              failureRows,
              featureCount: CSV_FEATURE_COUNT,
              loaded: true,
            },
          });
        } catch (error) {
          reject(error);
        }
      },
      error: (error: Error) => reject(error),
    });
  });
}

export function getFailureRowIndices(rows: SecomRow[]): number[] {
  return rows
    .map((row, index) => (row.passFail === 1 ? index : -1))
    .filter((index) => index >= 0);
}
