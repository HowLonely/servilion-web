import { describe, expect, it } from "vitest";

import { dayRangeToIsoUtc, formatDateTime, localInputToIsoUtc } from "./date";

describe("date helpers", () => {
  it("converts Chilean summer local time to UTC", () => {
    expect(localInputToIsoUtc("2026-01-15T10:30")).toBe("2026-01-15T13:30:00.000Z");
  });

  it("builds a complete Chilean winter day in UTC", () => {
    expect(dayRangeToIsoUtc("2026-07-10", "2026-07-10")).toEqual({
      date_from: "2026-07-10T04:00:00.000Z",
      date_to: "2026-07-11T03:59:59.000Z",
    });
  });

  it("formats backend timestamps in the application time zone", () => {
    expect(formatDateTime("2026-01-15T13:30:00.000Z")).toBe("15-01-2026 10:30");
    expect(formatDateTime(null)).toBe("—");
  });
});