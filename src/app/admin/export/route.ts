import ExcelJS from "exceljs";
import { isAdmin } from "@/lib/auth";
import { getBackupData, SHEETS } from "@/lib/data/backup";

// Owner-facing Excel backup (DECISIONS B.16). Admin-only; streams a multi-sheet
// .xlsx the owner can keep and later re-import. Not indexed (it's a download).
export async function GET() {
  if (!(await isAdmin())) return new Response("Unauthorized", { status: 401 });

  const data = await getBackupData();
  const wb = new ExcelJS.Workbook();

  const addSheet = (
    name: string,
    headers: readonly string[],
    rows: Record<string, unknown>[],
  ) => {
    const ws = wb.addWorksheet(name);
    ws.columns = headers.map((h) => ({ header: h, key: h, width: 18 }));
    ws.getRow(1).font = { bold: true };
    rows.forEach((r) => ws.addRow(r));
  };

  addSheet("Categories", SHEETS.Categories, data.categories);
  addSheet("Products", SHEETS.Products, data.products);
  addSheet("MenuItems", SHEETS.MenuItems, data.items);

  const buffer = await wb.xlsx.writeBuffer();
  const date = new Date().toISOString().slice(0, 10);
  return new Response(buffer as unknown as ArrayBuffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="menu-yedek-${date}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
