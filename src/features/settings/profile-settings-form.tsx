"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import Image from "next/image";

import { Button } from "~/components/ui/button";
import { Field } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { api } from "~/trpc/react";
import { MediaPicker } from "~/features/media/media-picker";

export function ProfileSettingsForm({
  profile,
}: {
  profile: {
    id: string;
    username: string;
    displayName: string;
    bio: string | null;
    avatarAssetId: string | null;
  };
}) {
  const t = useTranslations("settings");
  const common = useTranslations("common");
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [bio, setBio] = useState(profile.bio ?? "");
  const [username, setUsername] = useState(profile.username);
  const [avatarAssetId, setAvatarAssetId] = useState(profile.avatarAssetId);
  const utils = api.useUtils();
  const update = api.profile.update.useMutation({
    onSuccess: async () => {
      toast.success(t("profileSaved"));
      await utils.profile.mine.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });
  const changeUsername = api.profile.changeUsername.useMutation({
    onSuccess: async () => {
      toast.success(t("usernameSaved"));
      await utils.profile.mine.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });
  const setAvatar = api.profile.setAvatar.useMutation({
    onError: (error) => toast.error(error.message),
  });
  async function changeAvatar(assetId: string | null) {
    const previous = avatarAssetId;
    setAvatarAssetId(assetId);
    try {
      await setAvatar.mutateAsync({ profileId: profile.id, assetId });
      toast.success(t("profileSaved"));
      await utils.profile.mine.invalidate();
    } catch {
      setAvatarAssetId(previous);
    }
  }
  return (
    <div className="space-y-8">
      <section className="space-y-5">
        <div>
          <h3 className="text-base font-semibold">{t("profile")}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("profileDescription")}
          </p>
        </div>
        <div className="flex flex-col gap-4 rounded-md border border-border bg-surface p-4 sm:flex-row sm:items-center">
          <div className="relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-muted text-xl font-semibold">
            {avatarAssetId ? (
              <Image
                src={`/api/media/${avatarAssetId}`}
                alt=""
                fill
                unoptimized
                sizes="80px"
                className="object-cover"
              />
            ) : (
              displayName.slice(0, 1).toUpperCase()
            )}
          </div>
          <div className="grid flex-1 gap-2 sm:grid-cols-2">
            <MediaPicker
              kind="IMAGE"
              value={avatarAssetId}
              label={t("chooseAvatar")}
              description={t("chooseAvatarDescription")}
              onSelect={(asset) => void changeAvatar(asset.id)}
            />
            <Button
              variant="ghost"
              disabled={!avatarAssetId || setAvatar.isPending}
              onClick={() => void changeAvatar(null)}
            >
              {t("removeAvatar")}
            </Button>
          </div>
        </div>
        <Field label={t("displayName")} htmlFor="displayName">
          <Input
            id="displayName"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            maxLength={80}
          />
        </Field>
        <Field label={t("bio")} htmlFor="bio" optional={common("optional")}>
          <Textarea
            id="bio"
            value={bio}
            onChange={(event) => setBio(event.target.value)}
            maxLength={500}
            rows={5}
          />
        </Field>
        <Button
          loading={update.isPending}
          disabled={!displayName.trim()}
          onClick={() =>
            update.mutate({
              profileId: profile.id,
              displayName,
              bio: bio || null,
            })
          }
        >
          {common("saveChanges")}
        </Button>
      </section>
      <div className="h-px bg-border-subtle" />
      <section className="space-y-5">
        <Field
          label={t("username")}
          htmlFor="username"
          description={t("usernameHelp", { username })}
        >
          <div className="flex max-w-md gap-2">
            <Input
              id="username"
              value={username}
              onChange={(event) =>
                setUsername(event.target.value.toLowerCase())
              }
              autoCapitalize="none"
              spellCheck={false}
            />
            <Button
              variant="secondary"
              loading={changeUsername.isPending}
              disabled={!username.trim() || username === profile.username}
              onClick={() =>
                changeUsername.mutate({ profileId: profile.id, username })
              }
            >
              {t("changeUsername")}
            </Button>
          </div>
        </Field>
      </section>
    </div>
  );
}
