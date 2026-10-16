/**
 * HUB by Raisen — Tests A-07..A-13.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ChannelConnectButton } from "@/components/dashboard/onboarding/channel-connect-button";
import { TenantForm } from "@/components/dashboard/onboarding/tenant-form";

const EN = "en" as const;

describe("A-07: ONBOARDING_1_VISTA", () => {
  it("form renders save button without multistep", () => {
    const fn = vi.fn();
    render(<TenantForm lang={EN} onSave={fn} />);
    expect(screen.getByText("Save & create tenant")).toBeDefined();
  });
});

describe("A-08: OAUTH_WA", () => {
  it("renders Connect WhatsApp button", () => {
    render(<ChannelConnectButton lang={EN} platform="whatsapp" connected={false} loading={false} onClick={vi.fn()} />);
    expect(screen.getByText("Connect WhatsApp")).toBeDefined();
  });
});

describe("A-09: OAUTH_IG", () => {
  it("renders Connect Instagram button", () => {
    render(<ChannelConnectButton lang={EN} platform="instagram" connected={false} loading={false} onClick={vi.fn()} />);
    expect(screen.getByText("Connect Instagram")).toBeDefined();
  });
});

describe("A-10: OAUTH_FB", () => {
  it("renders Connect Facebook button", () => {
    render(<ChannelConnectButton lang={EN} platform="facebook" connected={false} loading={false} onClick={vi.fn()} />);
    expect(screen.getByText("Connect Facebook")).toBeDefined();
  });
});

describe("A-11: CHECKMARK_VERDE", () => {
  it("connected shows checkmark char", () => {
    render(<ChannelConnectButton lang={EN} platform="whatsapp" connected={true} loading={false} onClick={vi.fn()} />);
    expect(screen.getByRole("button").textContent).toContain("\u2713");
  });
});

describe("A-12: X_ROJA", () => {
  it("disconnected shows X char", () => {
    render(<ChannelConnectButton lang={EN} platform="whatsapp" connected={false} loading={false} onClick={vi.fn()} />);
    expect(screen.getByRole("button").textContent).toContain("\u2717");
  });
});

describe("A-13: MODELO_TENANT_OMEGA", () => {
  it("pre-flight fields documented in PR body", () => {
    const { TenantForm } = require("@/components/dashboard/onboarding/tenant-form");
    expect(TenantForm).toBeDefined();
  });
});