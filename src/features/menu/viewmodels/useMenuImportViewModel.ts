"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { handOffFile, isTemplateWorkbook } from "../import/handoff";
import { readSpreadsheet } from "../import/readSpreadsheet";
import {
  useImportMenuExcelMutation,
  usePreviewMenuExcelMutation,
  type ExcelImportResult,
  type ExcelPreview,
} from "../services/menuItemApi";
import { menuErrorMessage } from "./menuErrors";

/** The server refuses a workbook over 5 MB and takes up to 500 dishes. */
export const EXCEL_MAX_BYTES = 5 * 1024 * 1024;
export const EXCEL_MAX_ROWS = 500;

/**
 * Adds many dishes from an Excel workbook, using the server's template,
 * preview and import calls. The server checks every row before saving any, so
 * an import either adds all the dishes or none.
 */
export function useMenuImportViewModel() {
  const router = useRouter(),
    [preview, { isLoading: checking }] = usePreviewMenuExcelMutation(),
    [runImport, { isLoading: importing }] = useImportMenuExcelMutation(),
    [file, setFile] = useState<File | null>(null),
    [checked, setChecked] = useState<ExcelPreview | null>(null),
    [result, setResult] = useState<ExcelImportResult | null>(null),
    [problem, setProblem] = useState("");

  const reset = () => {
    setFile(null);
    setChecked(null);
    setResult(null);
    setProblem("");
  };

  /** Chooses a workbook and has the server check it. */
  const pick = async (chosen: File | undefined) => {
    if (!chosen) return;
    reset();
    if (!/\.xlsx$/i.test(chosen.name)) {
      setProblem("Choose an Excel file ending in .xlsx.");
      return;
    }
    if (chosen.size > EXCEL_MAX_BYTES) {
      setProblem("That file is over 5 MB. Split it into smaller files.");
      return;
    }
    setFile(chosen);
    try {
      // A file in the vendor's own layout (e.g. "Product" instead of "Item
      // Name") would come back from the server with every name missing, so it
      // goes to the import that matches its columns instead.
      let ownLayout = false;
      try {
        ownLayout = !isTemplateWorkbook(await readSpreadsheet(chosen));
      } catch {
        // Unreadable here: let the server's check report it.
      }
      if (ownLayout) {
        handOffFile(chosen);
        router.push("/menu/import");
        return;
      }
      setChecked(await preview(chosen).unwrap());
    } catch (e) {
      setProblem(menuErrorMessage(e));
    }
  };

  /** Adds the dishes; only offered once the check found no problems. */
  const start = async () => {
    if (!file || !checked?.valid || importing) return;
    setProblem("");
    try {
      const done = await runImport(file).unwrap();
      setResult(done);
      if (!done.imported)
        setProblem("Nothing was imported. Fix the rows below and upload the file again.");
    } catch (e) {
      setProblem(menuErrorMessage(e));
    }
  };

  return {
    fileName: file?.name ?? "",
    preview: checked,
    result,
    problem,
    checking,
    importing,
    done: result?.imported === true,
    // Rows to fix: from the check, or from an import the server turned down.
    errors: result && !result.imported ? result.errors : (checked?.errors ?? []),
    pick,
    start,
    reset,
  };
}
