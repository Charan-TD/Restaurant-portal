"use client";
import { useState } from "react";
import {
  fetchMenuExcelTemplate,
  useImportMenuExcelMutation,
  useListQtyTypesQuery,
  usePreviewMenuExcelMutation,
  type ExcelImportResult,
  type ExcelRowError,
} from "../services/menuItemApi";
import {
  buildDraft,
  emptyAddon,
  emptyDraftItem,
  validateDraft,
} from "../import/buildDraft";
import {
  detectSheet,
  detectWorkbook,
  mappingProblem,
  type Detection,
} from "../import/detectColumns";
import { matchPhotos, preparePhoto } from "../import/photos";
import { readSpreadsheet } from "../import/readSpreadsheet";
import {
  buildTemplateFile,
  defaultLayout,
  addonForTemplateRow,
  itemForTemplateRow,
  readTemplateLayout,
  type TemplateLayout,
} from "../import/toTemplate";
import {
  MAX_IMPORT_BYTES,
  MAX_IMPORT_ROWS,
  type ColumnMapping,
  type DraftAddon,
  type DraftItem,
  type RawWorkbook,
} from "../import/types";
import { menuErrorMessage } from "./menuErrors";

/** Where the vendor is: choosing a file, confirming columns, checking dishes, or finished. */
export type OwnFileStage = "choose" | "columns" | "review" | "check" | "done";

/** A server complaint about a row, with the dish it belongs to. */
export interface ServerRowError extends ExcelRowError {
  dish?: string;
}

/**
 * Imports a menu in the vendor's own layout. The sheet is read in the browser,
 * its columns are matched (or confirmed by the vendor), the dishes are checked
 * and fixed on screen, and then they are sent through the server's Excel import
 * in its own template format, so the server still checks every row and saves
 * all of them or none.
 */
export function useOwnFileImportViewModel() {
  const [preview, { isLoading: checking }] = usePreviewMenuExcelMutation(),
    [runImport, { isLoading: importing }] = useImportMenuExcelMutation(),
    [stage, setStage] = useState<OwnFileStage>("choose"),
    [book, setBook] = useState<RawWorkbook | null>(null),
    [detection, setDetection] = useState<Detection | null>(null),
    [items, setItems] = useState<DraftItem[]>([]),
    [baseline, setBaseline] = useState<DraftItem[]>([]),
    [reading, setReading] = useState(false),
    [problem, setProblem] = useState(""),
    [photoNote, setPhotoNote] = useState(""),
    [serverErrors, setServerErrors] = useState<ServerRowError[]>([]),
    [result, setResult] = useState<ExcelImportResult | null>(null),
    [layout, setLayout] = useState<TemplateLayout | null>(null);

  const sheet = book && detection ? book.sheets[detection.sheetIndex] : null,
    { data: qtyNames = [] } = useListQtyTypesQuery(),
    issues = validateDraft(items, qtyNames),
    issuesById = Map.groupBy(issues, (issue) => issue.itemId),
    tooMany = items.length > MAX_IMPORT_ROWS;

  const reset = () => {
    setStage("choose");
    setBook(null);
    setDetection(null);
    setItems([]);
    setProblem("");
    setPhotoNote("");
    setServerErrors([]);
    setResult(null);
  };

  const startReview = (from: RawWorkbook, found: Detection) => {
    const rows = buildDraft(from.sheets[found.sheetIndex], found.headerRow, found.mapping);
    if (!rows.length) {
      setProblem("No dishes were found below the headings. Check the heading row.");
      return false;
    }
    setItems(rows);
    setBaseline(rows);
    setStage("review");
    return true;
  };

  /** Reads the chosen file; clear headings go straight to the dishes, otherwise the columns are confirmed first. */
  const pick = async (file: File | undefined) => {
    if (!file) return;
    reset();
    if (file.size > MAX_IMPORT_BYTES) {
      setProblem("That file is over 5 MB. Split it into smaller files.");
      return;
    }
    setReading(true);
    try {
      const read = await readSpreadsheet(file),
        found = detectWorkbook(read);
      setBook(read);
      setDetection(found);
      if (found.automatic && found.records > 0) startReview(read, found);
      else setStage("columns");
    } catch (e) {
      setProblem(e instanceof Error ? e.message : "The file could not be read.");
    } finally {
      setReading(false);
    }
  };

  /** Another sheet of the workbook; its columns are detected again. */
  const chooseSheet = (index: number) => {
    if (!book) return;
    setDetection(detectSheet(book.sheets[index], index));
    setProblem("");
  };
  const chooseHeaderRow = (row: number) => {
    if (!book || !detection) return;
    const records = book.sheets[detection.sheetIndex].rows.filter(
      (r) => r.sourceRow > row && r.values.some((v) => v !== null && String(v).trim() !== ""),
    ).length;
    // Keep the columns the vendor already chose; only the heading row moves.
    setDetection({ ...detection, headerRow: row, records });
  };
  const setMapping = (mapping: ColumnMapping) =>
    detection && setDetection({ ...detection, mapping });

  const mapProblem = detection ? mappingProblem(detection.mapping) : null,
    canExtract =
      !!detection &&
      !mapProblem &&
      detection.mapping.name !== null &&
      detection.mapping.price !== null;
  const extract = () => {
    if (!book || !detection || !canExtract) return;
    setProblem("");
    startReview(book, detection);
  };

  const editItem = (id: string, patch: Partial<DraftItem>) =>
    setItems((all) => all.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  const removeItem = (id: string) =>
    setItems((all) => all.filter((i) => i.id !== id));
  /** One change applied to many dishes at once (the selected ones). */
  const editMany = (ids: Set<string>, patch: Partial<DraftItem>) =>
    setItems((all) => all.map((i) => (ids.has(i.id) ? { ...i, ...patch } : i)));
  const removeMany = (ids: Set<string>) =>
    setItems((all) => all.filter((i) => !ids.has(i.id)));
  /** Renames a category for every dish in it; a name already in use merges the two. */
  const renameCategory = (from: string, to: string) => {
    const next = to.trim();
    if (!next) return;
    setItems((all) => {
      // Reuse the spelling an existing category already has, so "dosa" joins "Dosa".
      const existing = all.find(
        (i) => i.category.trim() !== from && i.category.trim().toLowerCase() === next.toLowerCase(),
      )?.category.trim();
      return all.map((i) =>
        i.category.trim() === from ? { ...i, category: existing ?? next } : i,
      );
    });
  };
  /** Adds one add-on to every selected dish that does not already offer one of that name. */
  const addAddonMany = (ids: Set<string>, addon: Omit<DraftAddon, "id">) =>
    setItems((all) =>
      all.map((i) =>
        ids.has(i.id) &&
        !(i.addons ?? []).some((a) => a.name.trim().toLowerCase() === addon.name.trim().toLowerCase())
          ? { ...i, addons: [...(i.addons ?? []), emptyAddon(addon)] }
          : i,
      ),
    );
  /** Back to the dishes exactly as read from the file. */
  const resetDraft = () => setItems(baseline);
  const addItem = () => setItems((all) => [...all, emptyDraftItem()]);
  /** Sets one dish's picture, resized to a small JPEG the workbook can hold. */
  const setPhoto = async (id: string, file: File | undefined) => {
    if (!file) return;
    try {
      const photo = await preparePhoto(file);
      setItems((all) => all.map((i) => (i.id === id ? { ...i, photo } : i)));
      setPhotoNote("");
    } catch (e) {
      setPhotoNote(e instanceof Error ? e.message : "That picture could not be used.");
    }
  };
  const removePhoto = (id: string) => editItem(id, { photo: null });
  /** Many pictures at once, matched to dishes by the sheet's photo-file column or by dish name. */
  const attachPhotos = async (files: File[]) => {
    if (!files.length) return;
    const found = matchPhotos(items, files),
      prepared = new Map<string, File>(),
      failed: string[] = [];
    for (const [id, file] of found.matches) {
      try {
        prepared.set(id, await preparePhoto(file));
      } catch {
        failed.push(file.name);
      }
    }
    setItems((all) =>
      all.map((i) => (prepared.has(i.id) ? { ...i, photo: prepared.get(i.id)! } : i)),
    );
    const notes = [
      `${prepared.size} of ${files.length} ${files.length === 1 ? "picture" : "pictures"} matched.`,
      found.unmatched.length && `No dish found for: ${found.unmatched.join(", ")}.`,
      found.ambiguous.length && `Could fit more than one dish or file: ${found.ambiguous.join(", ")}.`,
      [...found.invalid, ...failed].length && `Not usable as pictures: ${[...found.invalid, ...failed].join(", ")}.`,
    ].filter(Boolean);
    setPhotoNote(notes.join(" "));
  };
  /** Fills a detail for every dish that has none, e.g. one prep time for the whole menu. */
  const fillBlank = (patch: Partial<Pick<DraftItem, "prepMinutes" | "foodType" | "category">>) =>
    setItems((all) =>
      all.map((i) => ({
        ...i,
        ...(patch.prepMinutes !== undefined && i.prepMinutes === null
          ? { prepMinutes: patch.prepMinutes }
          : {}),
        ...(patch.foodType && !i.foodType ? { foodType: patch.foodType } : {}),
        ...(patch.category && !i.category.trim() ? { category: patch.category } : {}),
      })),
    );

  /** The server's template headings; the last known ones when it cannot be fetched. */
  const loadLayout = async () => {
    if (layout) return layout;
    try {
      const live = await readTemplateLayout(await fetchMenuExcelTemplate());
      setLayout(live);
      return live;
    } catch {
      return defaultLayout;
    }
  };

  const explain = (errors: ExcelRowError[]): ServerRowError[] =>
    errors.map((e) => {
      if (/addon/i.test(e.sheet)) {
        const found = addonForTemplateRow(items, e.row);
        return {
          ...e,
          dish: found?.item.name,
          column: `Add-on "${found?.addon.name || "?"}" · ${e.column}`,
        };
      }
      return { ...e, dish: itemForTemplateRow(items, e.row)?.name };
    });

  /** Checks the dishes with the server, then adds them if it finds nothing wrong. */
  const send = async () => {
    if (importing || checking || issues.length || tooMany || !items.length) return;
    setProblem("");
    setServerErrors([]);
    try {
      const file = await buildTemplateFile(items, await loadLayout()),
        checked = await preview(file).unwrap();
      if (!checked.valid) {
        setServerErrors(explain(checked.errors));
        setProblem("The server found problems. Fix the dishes below and try again.");
        return;
      }
      const done = await runImport(file).unwrap();
      if (done.imported) {
        setResult(done);
        setStage("done");
      } else {
        setServerErrors(explain(done.errors));
        setProblem("Nothing was imported. Fix the dishes below and try again.");
      }
    } catch (e) {
      setProblem(menuErrorMessage(e));
    }
  };

  return {
    stage,
    qtyNames,
    book,
    sheet,
    detection,
    items,
    issues,
    issuesById,
    tooMany,
    problem,
    serverErrors,
    result,
    reading,
    checking,
    importing,
    busy: reading || checking || importing,
    mapProblem,
    canExtract,
    pick,
    chooseSheet,
    chooseHeaderRow,
    setMapping,
    extract,
    editItem,
    removeItem,
    addItem,
    fillBlank,
    setPhoto,
    removePhoto,
    attachPhotos,
    photoNote,
    editMany,
    renameCategory,
    addAddonMany,
    removeMany,
    resetDraft,
    toCheck: () => setStage("check"),
    backToReview: () => setStage("review"),
    send,
    reset,
    backToColumns: () => book && setStage("columns"),
  };
}

export type OwnFileImport = ReturnType<typeof useOwnFileImportViewModel>;
