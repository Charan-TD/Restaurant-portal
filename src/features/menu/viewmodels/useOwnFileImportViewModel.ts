"use client";
import { useEffect, useState } from "react";
import {
  fetchMenuExcelTemplate,
  useImportMenuExcelMutation,
  useCreateQtyTypeMutation,
  useListQtyTypesQuery,
  usePreviewMenuExcelMutation,
  type ExcelImportResult,
  type ExcelRowError,
} from "../services/menuItemApi";
import {
  buildDraft,
  emptyAddon,
  emptyDraftItem,
  newQtyTypes,
  validateDraft,
} from "../import/buildDraft";
import {
  describeDetection,
  detectSheet,
  detectWorkbook,
  type Detection,
} from "../import/detectColumns";
import { takeHandedOffFile } from "../import/handoff";
import { preparePhoto } from "../import/photos";
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
  type DraftAddon,
  type DraftItem,
  type RawWorkbook,
} from "../import/types";
import { menuErrorMessage } from "./menuErrors";

/** Where the vendor is: choosing a file, fixing dishes, checking them, or finished. */
export type OwnFileStage = "choose" | "review" | "check" | "done";

/** A server complaint about a row, with the dish it belongs to. */
export interface ServerRowError extends ExcelRowError {
  dish?: string;
  /** The dish on screen this error belongs to, so its row can show it. */
  itemId?: string;
}

/**
 * Imports a menu in the vendor's own layout. The sheet is read in the browser,
 * its columns are matched from their headings and values, the dishes are checked
 * and fixed on screen, and then they are sent through the server's Excel import
 * in its own template format, so the server still checks every row and saves
 * all of them or none.
 */
export function useOwnFileImportViewModel() {
  const [preview, { isLoading: checking }] = usePreviewMenuExcelMutation(),
    [runImport, { isLoading: importing }] = useImportMenuExcelMutation(),
    [createQtyType, { isLoading: savingSizes }] = useCreateQtyTypeMutation(),
    [stage, setStage] = useState<OwnFileStage>("choose"),
    [book, setBook] = useState<RawWorkbook | null>(null),
    [detection, setDetection] = useState<Detection | null>(null),
    [items, setItems] = useState<DraftItem[]>([]),
    [baseline, setBaseline] = useState<DraftItem[]>([]),
    [reading, setReading] = useState(false),
    [problem, setProblem] = useState(""),
    [photoNote, setPhotoNote] = useState(""),
    [serverErrors, setServerErrors] = useState<ServerRowError[]>([]),
    // The dishes the server last accepted; any edit after that makes it out of date.
    [accepted, setAccepted] = useState<DraftItem[] | null>(null),
    [result, setResult] = useState<ExcelImportResult | null>(null),
    [layout, setLayout] = useState<TemplateLayout | null>(null);

  const sheet = book && detection ? book.sheets[detection.sheetIndex] : null,
    { data: qtyNames = [] } = useListQtyTypesQuery(),
    issues = validateDraft(items),
    // Sizes the restaurant does not have yet; saved as quantity types before the server check.
    newSizes = newQtyTypes(items, qtyNames),
    columns = sheet && detection ? describeDetection(sheet, detection) : null,
    issuesById = Map.groupBy(issues, (issue) => issue.itemId),
    tooMany = items.length > MAX_IMPORT_ROWS,
    serverOk = accepted !== null && accepted === items,
    serverById = Map.groupBy(
      serverErrors.filter((e) => e.itemId),
      (e) => e.itemId as string,
    );

  const reset = () => {
    setStage("choose");
    setBook(null);
    setDetection(null);
    setItems([]);
    setProblem("");
    setPhotoNote("");
    setServerErrors([]);
    setAccepted(null);
    setResult(null);
  };

  const startReview = (from: RawWorkbook, found: Detection) => {
    const rows = buildDraft(from.sheets[found.sheetIndex], found.headerRow, found.mapping);
    if (!rows.length) {
      setProblem(`No dishes were found in "${from.sheets[found.sheetIndex].name}". Check that the file has one dish per row.`);
      return false;
    }
    setDetection(found);
    setItems(rows);
    setBaseline(rows);
    setServerErrors([]);
    setAccepted(null);
    setStage("review");
    return true;
  };

  /** Reads the chosen file and goes straight to the dishes; anything not found shows as missing on each dish. */
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
      startReview(read, found);
    } catch (e) {
      setProblem(e instanceof Error ? e.message : "The file could not be read.");
    } finally {
      setReading(false);
    }
  };

  /** Reads the dishes from another sheet of the workbook; edits made so far are replaced. */
  const chooseSheet = (index: number) => {
    if (!book || index === detection?.sheetIndex) return;
    setProblem("");
    startReview(book, detectSheet(book.sheets[index], index));
  };

  // A file chosen in the template dialog that is not in the template's
  // layout arrives here, and is read as if chosen on this page.
  useEffect(() => {
    const handed = takeHandedOffFile();
    if (handed) queueMicrotask(() => void pick(handed));
    // Once, on opening the page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
          itemId: found?.item.id,
          dish: found?.item.name,
          column: `Add-on "${found?.addon.name || "?"}" · ${e.column}`,
        };
      }
      const dish = itemForTemplateRow(items, e.row);
      return { ...e, itemId: dish?.id, dish: dish?.name };
    });

  /**
   * Sends the dishes to the server's excel-preview check without saving anything.
   * Its complaints land on the matching rows; when it finds none the vendor
   * can go on to the final check.
   */
  const validate = async () => {
    if (importing || checking || savingSizes || tooMany || !items.length) return;
    setProblem("");
    setServerErrors([]);
    setAccepted(null);
    try {
      // New sizes go into the restaurant's quantity types first, so the server knows them.
      for (const name of newSizes) await createQtyType(name).unwrap();
      const checked = await preview(await buildTemplateFile(items, await loadLayout())).unwrap();
      if (!checked.valid) {
        const found = explain(checked.errors);
        setServerErrors(found);
        setProblem(
          `The server found ${found.length} ${found.length === 1 ? "problem" : "problems"}. Fix the highlighted dishes and validate again.`,
        );
        return;
      }
      setAccepted(items);
      if (!issues.length) setStage("check");
    } catch (e) {
      setProblem(menuErrorMessage(e));
    }
  };

  /** Adds the dishes the server has accepted; the server still checks every row again. */
  const send = async () => {
    if (importing || checking || issues.length || tooMany || !items.length || !serverOk) return;
    setProblem("");
    setServerErrors([]);
    try {
      const file = await buildTemplateFile(items, await loadLayout()),
        done = await runImport(file).unwrap();
      if (done.imported) {
        setResult(done);
        setStage("done");
      } else {
        setServerErrors(explain(done.errors));
        setAccepted(null);
        setProblem("Nothing was imported. Fix the highlighted dishes, validate again and retry.");
        setStage("review");
      }
    } catch (e) {
      setProblem(menuErrorMessage(e));
    }
  };

  return {
    stage,
    qtyNames,
    newSizes,
    book,
    sheet,
    detection,
    columns,
    items,
    issues,
    issuesById,
    tooMany,
    problem,
    serverErrors,
    serverById,
    serverOk,
    validate,
    result,
    reading,
    checking,
    importing,
    savingSizes,
    busy: reading || checking || importing || savingSizes,
    pick,
    chooseSheet,
    editItem,
    removeItem,
    addItem,
    fillBlank,
    setPhoto,
    removePhoto,
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
  };
}

export type OwnFileImport = ReturnType<typeof useOwnFileImportViewModel>;
