import { Platform } from "react-native";

type PickerMode = "date" | "time" | "datetime-local";

type OpenWebDateTimePickerArgs = {
  mode: PickerMode;
  value?: Date;
  min?: Date;
  max?: Date;
  onSelect: (selected: Date) => void;
};

const toDateInputValue = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const toTimeInputValue = (date: Date) => {
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  return `${hour}:${minute}`;
};

const toDateTimeLocalValue = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hour}:${minute}`;
};

export const openWebDateTimePicker = ({
  mode,
  value,
  min,
  max,
  onSelect,
}: OpenWebDateTimePickerArgs) => {
  if (Platform.OS !== "web") return false;

  const base = value || new Date();
  const input = document.createElement("input");
  const uniqueId = `web-datetime-picker-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  input.type = mode;
  input.id = uniqueId;
  input.name = uniqueId;
  input.setAttribute("aria-label", "Date time picker");
  input.autocomplete = "off";
  input.style.position = "fixed";
  input.style.opacity = "0";
  input.style.width = "1px";
  input.style.height = "1px";
  input.style.left = "0";
  input.style.top = "0";
  input.style.zIndex = "-1";

  if (mode === "date") {
    input.value = toDateInputValue(base);
    if (min) input.min = toDateInputValue(min);
    if (max) input.max = toDateInputValue(max);
  } else if (mode === "time") {
    input.value = toTimeInputValue(base);
  } else {
    input.value = toDateTimeLocalValue(base);
    if (min) input.min = toDateTimeLocalValue(min);
    if (max) input.max = toDateTimeLocalValue(max);
  }

  let settled = false;

  const cleanup = () => {
    if (input.parentNode) {
      input.parentNode.removeChild(input);
    }
  };

  input.onchange = () => {
    settled = true;
    const raw = input.value;
    if (!raw) {
      cleanup();
      return;
    }

    let selected: Date | null = null;

    if (mode === "date") {
      selected = new Date(`${raw}T00:00:00`);
    } else if (mode === "time") {
      const [h, m] = raw.split(":").map(Number);
      const next = new Date(base);
      if (!Number.isNaN(h) && !Number.isNaN(m)) {
        next.setHours(h, m, 0, 0);
        selected = next;
      }
    } else {
      const parsed = new Date(raw);
      if (!Number.isNaN(parsed.getTime())) {
        selected = parsed;
      }
    }

    if (selected && !Number.isNaN(selected.getTime())) {
      onSelect(selected);
    }
    cleanup();
  };

  input.onblur = () => {
    // Do not remove immediately; some browsers fire blur before the picker completes.
    setTimeout(() => {
      if (!settled) cleanup();
    }, 600);
  };

  document.body.appendChild(input);
  const anyInput = input as HTMLInputElement & { showPicker?: () => void };
  if (typeof anyInput.showPicker === "function") {
    anyInput.showPicker();
  } else {
    input.focus();
    input.click();
  }
  return true;
};
