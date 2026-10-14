import { useQuery } from "@tanstack/react-query";
import { getPrivacyConfig, getConsentLog } from "@/lib/settings-client";
import type { PrivacyConfig, Result, ConsentLogEntry } from "@/lib/settings-client";

export function usePrivacyConfig() {
  return useQuery({
    queryKey: ["privacy_config"],
    queryFn: getPrivacyConfig,
    staleTime: 60_000,
  });
}

export function useConsentLog() {
  return useQuery({
    queryKey: ["consent_log"],
    queryFn: getConsentLog,
    staleTime: 60_000,
  });
}

export function extractConfig(data: Result<PrivacyConfig, Error> | undefined): PrivacyConfig {
  if (data?.ok === true) return data.value;
  return {
    ai_disclosure_accepted: false,
    ai_disclosure_accepted_at: null,
    privacy_policy_version: null,
    tos_version: null,
    data_retention_days: null,
    updated_at: null,
  };
}

export function extractConsentLog(data: Result<ConsentLogEntry[], Error> | undefined): ConsentLogEntry[] {
  return data?.ok === true ? data.value : [];
}

export type { PrivacyConfig, ConsentLogEntry };