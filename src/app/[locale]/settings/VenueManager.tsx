"use client";

import { useActionState, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, ChevronUp, ChevronDown, Store } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Field } from "@/components/ui/form";
import { ImageField } from "@/components/ui/ImageField";
import { Card, CardHeader } from "@/components/ui/Card";
import { SavedHint } from "@/components/ui/SavedHint";
import {
  createVenueAction,
  updateVenueNameAction,
  deleteVenueAction,
  moveVenueAction,
  type VenueFormState,
} from "./venue-actions";
import { updateVenueWordmarkAction, type SettingsFormState } from "./settings-actions";

type Venue = { slug: string; name: string; wordmark: string | null };

function NameForm({ venue }: { venue: Venue }) {
  const [state, action, pending] = useActionState(
    updateVenueNameAction.bind(null, venue.slug),
    {} as VenueFormState,
  );
  const router = useRouter();
  useEffect(() => {
    if (state.ok) router.refresh();
  }, [state.ok, router]);
  return (
    <form action={action} className="flex flex-col gap-1">
      <Field label="Ad">
        <Input name="name" defaultValue={venue.name} required />
      </Field>
      {state.error && <p className="font-body text-xs text-mono-red">{state.error}</p>}
      <div className="flex items-center gap-2">
        <Button type="submit" disabled={pending} className="text-xs">
          {pending ? "…" : "Adı kaydet"}
        </Button>
        {state.ok && !pending && <SavedHint />}
      </div>
    </form>
  );
}

function WordmarkForm({ venue }: { venue: Venue }) {
  const [state, action, pending] = useActionState(
    updateVenueWordmarkAction.bind(null, venue.slug),
    {} as SettingsFormState,
  );
  const router = useRouter();
  useEffect(() => {
    if (state.ok) router.refresh();
  }, [state.ok, router]);
  return (
    <form action={action} className="flex flex-col gap-1">
      <ImageField
        name="image"
        initial={venue.wordmark}
        label="Wordmark"
        hint="Mekanın alt kısmında görünür. Boşsa marka işareti kullanılır."
      />
      {state.error && <p className="font-body text-xs text-mono-red">{state.error}</p>}
      <div className="flex items-center gap-2">
        <Button type="submit" disabled={pending} className="text-xs">
          {pending ? "…" : "Wordmark kaydet"}
        </Button>
        {state.ok && !pending && <SavedHint />}
      </div>
    </form>
  );
}

function VenueRow({
  venue,
  index,
  count,
}: {
  venue: Venue;
  index: number;
  count: number;
}) {
  const [confirming, setConfirming] = useState(false);
  const router = useRouter();

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-muted/20 p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="font-body text-xs text-muted">/{venue.slug}</span>
        <div className="flex items-center gap-1">
          <form action={moveVenueAction.bind(null, venue.slug, "up")} className="flex">
            <button
              type="submit"
              disabled={index === 0}
              aria-label={`${venue.name} yukarı taşı`}
              className="text-muted transition-colors hover:text-foreground disabled:opacity-30"
            >
              <ChevronUp size={16} aria-hidden />
            </button>
          </form>
          <form action={moveVenueAction.bind(null, venue.slug, "down")} className="flex">
            <button
              type="submit"
              disabled={index === count - 1}
              aria-label={`${venue.name} aşağı taşı`}
              className="text-muted transition-colors hover:text-foreground disabled:opacity-30"
            >
              <ChevronDown size={16} aria-hidden />
            </button>
          </form>
          {/* Can't delete the last remaining venue. */}
          <button
            type="button"
            disabled={count <= 1}
            aria-label={`${venue.name} sil`}
            onClick={() => setConfirming(true)}
            className="text-muted transition-colors hover:text-mono-red disabled:opacity-30"
          >
            <Trash2 size={16} aria-hidden />
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <NameForm venue={venue} />
        <WordmarkForm venue={venue} />
      </div>

      {confirming && (
        <Modal open onClose={() => setConfirming(false)} title="Mekan silinsin mi?">
          <p className="mb-4 font-body text-sm">
            “{venue.name}” ve menüsü (kategori/ürün yerleşimleri) <strong>kalıcı</strong>{" "}
            silinecek. Ürün ve kategori kataloğu etkilenmez. Bu işlem geri alınamaz.
          </p>
          <form
            action={async () => {
              await deleteVenueAction(venue.slug);
              setConfirming(false);
              router.refresh();
            }}
            className="flex justify-end gap-2"
          >
            <Button type="button" variant="ghost" onClick={() => setConfirming(false)}>
              İptal
            </Button>
            <Button type="submit" variant="danger">
              Kalıcı olarak sil
            </Button>
          </form>
        </Modal>
      )}
    </div>
  );
}

function AddVenueModal({ onClose }: { onClose: () => void }) {
  const [state, action, pending] = useActionState(createVenueAction, {} as VenueFormState);
  const router = useRouter();
  useEffect(() => {
    if (state.ok) {
      onClose();
      router.refresh();
    }
  }, [state.ok, onClose, router]);
  return (
    <Modal open onClose={onClose} title="Mekan ekle">
      <form action={action} className="flex flex-col gap-3">
        <p className="font-body text-xs text-muted">
          Yeni bir mekan (örn. Rooftop) ekle. Boş bir menüyle oluşturulur; adres
          otomatik türetilir.
        </p>
        <Field label="Mekan adı" error={state.error}>
          <Input name="name" required autoFocus />
        </Field>
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose}>
            İptal
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? "Ekleniyor…" : "Ekle"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function VenueManager({ venues }: { venues: Venue[] }) {
  const [adding, setAdding] = useState(false);
  const close = useCallback(() => setAdding(false), []);
  return (
    <Card>
      <CardHeader
        icon={Store}
        title="Mekanlar"
        description="Menü mekanları — ad, wordmark, sıra. Ekle, sırala veya sil."
      />
      <div className="flex flex-col gap-4">
        {venues.map((v, i) => (
          <VenueRow key={v.slug} venue={v} index={i} count={venues.length} />
        ))}
        <Button
          variant="ghost"
          className="flex items-center gap-1 self-start px-2 py-1 text-xs"
          onClick={() => setAdding(true)}
        >
          <Plus size={14} aria-hidden /> Mekan ekle
        </Button>
      </div>
      {adding && <AddVenueModal onClose={close} />}
    </Card>
  );
}
