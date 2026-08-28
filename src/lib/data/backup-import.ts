import "server-only";
import ExcelJS from "exceljs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { config } from "@/lib/config";
import { isDietaryTag } from "@/lib/dietary";
import { SHEETS } from "@/lib/data/backup";

// Import the owner's Excel backup (DECISIONS B.16). Fully validated first: if ANY
// row is bad, nothing is written and the caller gets row-level errors. Valid
// files are applied as an upsert (slug-keyed) inside one transaction, so the menu
// never ends up half-updated. Full-replace is intentionally NOT offered here —
// upsert can't delete, which keeps a mistaken import non-destructive.

export type ImportResult =
  | { ok: true; counts: { categories: number; products: number; items: number } }
  | { ok: false; errors: string[] };

const optionalText = z.string().trim().optional().default("");

// Robust boolean: accepts real booleans and common text/number spellings (Excel
// users may type TRUE/FALSE/1/0/Evet/Hayır) instead of z.coerce.boolean, which
// would treat the string "false" as truthy.
const boolField = z.preprocess((v) => {
  if (typeof v === "boolean") return v;
  const s = String(v).trim().toLowerCase();
  if (["true", "1", "yes", "evet", "x"].includes(s)) return true;
  if (["false", "0", "no", "hayır", ""].includes(s)) return false;
  return v;
}, z.boolean());

const categorySchema = z.object({
  slug: z.string().trim().min(1),
  nameTr: z.string().trim().min(1),
  nameEn: optionalText,
  nameRu: optionalText,
  columns: z
    .union([z.coerce.number().int().min(1).max(6), z.literal("")])
    .optional(),
});

const productSchema = z.object({
  slug: z.string().trim().min(1),
  kind: z.enum(["FOOD", "DRINK"]),
  tag: optionalText,
  image: optionalText,
  titleTr: z.string().trim().min(1),
  titleEn: optionalText,
  titleRu: optionalText,
  descTr: optionalText,
  descEn: optionalText,
  descRu: optionalText,
  calories: z
    .union([z.coerce.number().int().min(0).max(100000), z.literal("")])
    .optional(),
  dietary: optionalText, // pipe-joined tags, e.g. "vegan|halal"
});

const itemSchema = z.object({
  venueSlug: z.string().trim().min(1),
  categorySlug: z.string().trim().min(1),
  productSlug: z.string().trim().min(1),
  price: z.union([z.coerce.number().min(0).max(config.price.max), z.literal("")]).optional(),
  available: boolField,
  sortOrder: z.coerce.number().int().min(0).default(0),
  featured: boolField,
  measures: optionalText,
});

type CategoryIn = z.infer<typeof categorySchema>;
type ProductIn = z.infer<typeof productSchema>;
type ItemIn = z.infer<typeof itemSchema>;

// exceljs cell values can be strings, numbers, booleans, dates, or rich/formula
// objects — normalize to a primitive our zod coercions understand.
function cellValue(v: ExcelJS.CellValue): string | number | boolean {
  if (v === null || v === undefined) return "";
  if (typeof v === "object") {
    if ("text" in v && typeof v.text === "string") return v.text;
    if ("result" in v) return (v.result as string | number) ?? "";
    if ("richText" in v && Array.isArray(v.richText))
      return v.richText.map((r) => r.text).join("");
    return "";
  }
  return v as string | number | boolean;
}

function readSheet(
  wb: ExcelJS.Workbook,
  name: string,
  headers: readonly string[],
): Record<string, string | number | boolean>[] {
  const ws = wb.getWorksheet(name);
  if (!ws) return [];
  const rows: Record<string, string | number | boolean>[] = [];
  ws.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // header
    const obj: Record<string, string | number | boolean> = {};
    let empty = true;
    headers.forEach((h, i) => {
      const val = cellValue(row.getCell(i + 1).value);
      if (val !== "") empty = false;
      obj[h] = val;
    });
    if (!empty) obj.__row = rowNumber;
    if (!empty) rows.push(obj);
  });
  return rows;
}

function collect<T>(
  rows: Record<string, string | number | boolean>[],
  schema: z.ZodType<T>,
  sheet: string,
  errors: string[],
): T[] {
  const out: T[] = [];
  for (const raw of rows) {
    const parsed = schema.safeParse(raw);
    if (parsed.success) {
      out.push(parsed.data);
    } else {
      const line = raw.__row ?? "?";
      const msg = parsed.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; ");
      errors.push(`${sheet} satır ${line}: ${msg}`);
    }
  }
  return out;
}

function measureRows(measures: string): { label: string; amount: number }[] {
  if (!measures.trim()) return [];
  return measures
    .split("|")
    .map((part) => {
      const idx = part.lastIndexOf(":");
      if (idx < 0) return null;
      const label = part.slice(0, idx).trim();
      const amount = Number(part.slice(idx + 1).trim());
      if (!label || Number.isNaN(amount)) return null;
      return { label, amount };
    })
    .filter((m): m is { label: string; amount: number } => m !== null);
}

export async function importBackup(buffer: ArrayBuffer): Promise<ImportResult> {
  const errors: string[] = [];
  const wb = new ExcelJS.Workbook();
  try {
    await wb.xlsx.load(buffer);
  } catch {
    return { ok: false, errors: ["Dosya okunamadı — geçerli bir .xlsx değil."] };
  }

  const categories = collect<CategoryIn>(
    readSheet(wb, "Categories", SHEETS.Categories),
    categorySchema,
    "Categories",
    errors,
  );
  const products = collect<ProductIn>(
    readSheet(wb, "Products", SHEETS.Products),
    productSchema,
    "Products",
    errors,
  );
  const items = collect<ItemIn>(
    readSheet(wb, "MenuItems", SHEETS.MenuItems),
    itemSchema,
    "MenuItems",
    errors,
  );

  if (errors.length) return { ok: false, errors };

  const business = await prisma.business.findFirst({ select: { id: true } });
  if (!business) return { ok: false, errors: ["İşletme bulunamadı."] };
  const businessId = business.id;

  // Referential integrity for items (venue/category/product must resolve after
  // the category/product upserts). Check venues up front; categories/products are
  // guaranteed by the sheets or existing rows (verified inside the tx below).
  const venues = await prisma.venue.findMany({
    select: { slug: true, id: true, menu: { select: { id: true } } },
  });
  const venueBySlug = new Map(venues.map((v) => [v.slug, v]));
  for (const it of items) {
    const venue = venueBySlug.get(it.venueSlug);
    if (!venue) errors.push(`MenuItems: bilinmeyen mekan "${it.venueSlug}".`);
    else if (!venue.menu) errors.push(`MenuItems: "${it.venueSlug}" menüsü yok.`);
  }
  if (errors.length) return { ok: false, errors };

  await prisma.$transaction(async (tx) => {
    // 1) Categories (create/update identity + translations).
    for (const c of categories) {
      const existing = await tx.category.findFirst({
        where: { businessId, slug: c.slug },
        select: { id: true },
      });
      const columns = c.columns === "" || c.columns === undefined ? null : c.columns;
      const catId = existing
        ? (await tx.category.update({ where: { id: existing.id }, data: { columns } }))
            .id
        : (await tx.category.create({ data: { businessId, slug: c.slug, columns } }))
            .id;
      const names: [string, string][] = [
        ["tr", c.nameTr],
        ["en", c.nameEn],
        ["ru", c.nameRu],
      ];
      for (const [locale, name] of names) {
        if (name.trim()) {
          await tx.categoryTranslation.upsert({
            where: { categoryId_locale: { categoryId: catId, locale } },
            update: { name: name.trim() },
            create: { categoryId: catId, locale, name: name.trim() },
          });
        } else if (locale !== "tr") {
          await tx.categoryTranslation.deleteMany({ where: { categoryId: catId, locale } });
        }
      }
    }

    // 2) Products (create/update identity + translations + details).
    for (const p of products) {
      const existing = await tx.product.findFirst({
        where: { businessId, slug: p.slug },
        select: { id: true },
      });
      const dietary = p.dietary
        .split("|")
        .map((s) => s.trim())
        .filter(isDietaryTag);
      const data = {
        kind: p.kind,
        tag: p.tag || null,
        image: p.image || null,
        calories: p.calories === "" || p.calories === undefined ? null : p.calories,
        dietary,
      };
      const prodId = existing
        ? (await tx.product.update({ where: { id: existing.id }, data })).id
        : (await tx.product.create({ data: { businessId, slug: p.slug, ...data } })).id;
      // title + description per locale (a translation row needs a title).
      const rows: [string, string, string][] = [
        ["tr", p.titleTr, p.descTr],
        ["en", p.titleEn, p.descEn],
        ["ru", p.titleRu, p.descRu],
      ];
      for (const [locale, title, desc] of rows) {
        if (title.trim()) {
          const description = desc.trim() || null;
          await tx.productTranslation.upsert({
            where: { productId_locale: { productId: prodId, locale } },
            update: { title: title.trim(), description },
            create: { productId: prodId, locale, title: title.trim(), description },
          });
        } else if (locale !== "tr") {
          await tx.productTranslation.deleteMany({ where: { productId: prodId, locale } });
        }
      }
    }

    // 3) Menu items (venue placement, price/measures, flags).
    for (const it of items) {
      const venue = venueBySlug.get(it.venueSlug)!;
      const menuId = venue.menu!.id;
      const category = await tx.category.findFirst({
        where: { businessId, slug: it.categorySlug },
        select: { id: true },
      });
      const product = await tx.product.findFirst({
        where: { businessId, slug: it.productSlug },
        select: { id: true },
      });
      if (!category || !product) {
        // Should not happen after the sheet upserts; guard defensively.
        throw new Error(
          `MenuItems: "${it.categorySlug}"/"${it.productSlug}" çözümlenemedi.`,
        );
      }
      // Ensure the category is linked to this venue's menu (so it renders).
      await tx.menuCategory.upsert({
        where: { menuId_categoryId: { menuId, categoryId: category.id } },
        update: {},
        create: { menuId, categoryId: category.id, sortOrder: 0 },
      });
      const measures = measureRows(it.measures);
      const price =
        measures.length || it.price === "" || it.price === undefined ? null : it.price;

      const existingItem = await tx.menuItem.findFirst({
        where: { menuId, productId: product.id },
        select: { id: true },
      });
      const itemData = {
        categoryId: category.id,
        price,
        available: it.available,
        sortOrder: it.sortOrder,
        featured: it.featured,
      };
      const menuItemId = existingItem
        ? (await tx.menuItem.update({ where: { id: existingItem.id }, data: itemData })).id
        : (
            await tx.menuItem.create({
              data: { menuId, productId: product.id, ...itemData },
            })
          ).id;
      await tx.menuItemPrice.deleteMany({ where: { menuItemId } });
      if (measures.length) {
        await tx.menuItemPrice.createMany({
          data: measures.map((m, i) => ({
            menuItemId,
            label: m.label,
            amount: m.amount,
            sortOrder: i,
          })),
        });
      }
    }
  });

  return {
    ok: true,
    counts: {
      categories: categories.length,
      products: products.length,
      items: items.length,
    },
  };
}
