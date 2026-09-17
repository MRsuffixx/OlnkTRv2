"use client";

import { Check, LoaderCircle, X } from "lucide-react";
import { useDeferredValue, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "~/components/ui/button";
import { Field } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { api } from "~/trpc/react";

export function OnboardingForm({
  initialDisplayName,
}: {
  initialDisplayName: string;
}) {
  const t = useTranslations("auth");
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const deferredUsername = useDeferredValue(username.trim().toLowerCase());
  const canCheck =
    /^[a-z0-9](?:[a-z0-9_]*[a-z0-9])?$/.test(deferredUsername) &&
    deferredUsername.length >= 3;
  const availability = api.profile.usernameAvailable.useQuery(
    { username: deferredUsername },
    { enabled: canCheck, staleTime: 10_000 },
  );
  const onboard = api.profile.onboard.useMutation({
    onSuccess: () => {
      router.replace("/dashboard");
      router.refresh();
    },
    onError: (error) => toast.error(error.message),
  });
  const ready =
    canCheck && availability.data === true && displayName.trim().length > 0;
  const feedback = !username ? null : availability.isFetching ? (
    <span className="flex items-center gap-1 text-muted-foreground">
      <LoaderCircle className="size-3 animate-spin" />
      {t("usernameChecking")}
    </span>
  ) : canCheck && availability.data ? (
    <span className="flex items-center gap-1 text-success">
      <Check className="size-3" />
      {t("usernameAvailable")}
    </span>
  ) : (
    <span className="flex items-center gap-1 text-danger">
      <X className="size-3" />
      {t("usernameUnavailable")}
    </span>
  );
  return (
    <form
      className="space-y-6"
      onSubmit={(event) => {
        event.preventDefault();
        if (ready) onboard.mutate({ username: deferredUsername, displayName });
      }}
    >
      <Field
        label={t("chooseUsername")}
        htmlFor="username"
        description="olnk.tr/username"
      >
        <div className="flex h-9 items-center rounded-sm border border-border bg-background focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15">
          <span
            className="pl-3 text-sm text-muted-foreground"
            aria-hidden="true"
          >
            olnk.tr/
          </span>
          <input
            id="username"
            name="username"
            className="h-full min-w-0 flex-1 bg-transparent px-1.5 text-sm outline-none"
            value={username}
            onChange={(event) =>
              setUsername(event.target.value.toLowerCase().replace(/\s/g, ""))
            }
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            maxLength={30}
          />
        </div>
        <div className="mt-1 min-h-4 text-xs" aria-live="polite">
          {feedback}
        </div>
      </Field>
      <div className="h-px bg-border-subtle" />
      <Field label={t("displayName")} htmlFor="displayName">
        <Input
          id="displayName"
          name="displayName"
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          placeholder={t("displayNamePlaceholder")}
          autoComplete="nickname"
          maxLength={80}
        />
      </Field>
      <Button
        type="submit"
        className="w-full"
        loading={onboard.isPending}
        disabled={!ready}
      >
        {t("createProfile")}
      </Button>
    </form>
  );
}
