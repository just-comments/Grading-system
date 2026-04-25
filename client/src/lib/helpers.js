export function buildDefaultWeights(components) {
  if (!components.length) {
    return {};
  }

  const evenWeight = Number((100 / components.length).toFixed(2));
  const weights = {};
  let running = 0;

  components.forEach((component, index) => {
    if (index === components.length - 1) {
      weights[component] = Number((100 - running).toFixed(2));
      return;
    }

    weights[component] = evenWeight;
    running += evenWeight;
  });

  return weights;
}

export function formatNumber(value) {
  if (value == null || Number.isNaN(Number(value))) {
    return "--";
  }

  return Number(value).toFixed(2);
}

export function displayCell(value) {
  if (value == null) {
    return "--";
  }

  if (typeof value === "string" && value.trim() === "") {
    return "--";
  }

  return String(value);
}

export function downloadBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
}
