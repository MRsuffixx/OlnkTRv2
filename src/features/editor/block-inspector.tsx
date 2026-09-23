"use client";

import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "~/components/ui/button";
import { Field } from "~/components/ui/field";
import { IconButton } from "~/components/ui/icon-button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import type { EditorBlock } from "./editor-reducer";
import { blockTitleKeys } from "./block-labels";
import { BasicBlockInspector } from "./inspectors/basic-block-inspector";
import { isBasicBlockType } from "./preview/basic-block-preview";

export function BlockInspector({
  block,
  onChange,
  onBack,
}: {
  block: EditorBlock;
  onChange: (config: unknown) => void;
  onBack: () => void;
}) {
  const t = useTranslations("editor");
  const common = useTranslations("common");
  const config =
    block.config && typeof block.config === "object"
      ? (block.config as Record<string, unknown>)
      : {};
  const patch = (value: Record<string, unknown>) =>
    onChange({ ...config, ...value });

  return (
    <div className="h-full overflow-y-auto">
      <div className="flex items-center gap-2 border-b border-border-subtle p-3">
        <IconButton label={common("back")} onClick={onBack}>
          <ArrowLeft />
        </IconButton>
        <div>
          <p className="text-xs font-medium text-muted-foreground">
            {t("editBlock")}
          </p>
          <h3 className="mt-0.5 text-sm font-semibold">
            {t(blockTitleKeys[block.type as keyof typeof blockTitleKeys] ?? "editBlock")}
          </h3>
        </div>
      </div>
      <div className="grid gap-5 p-4">
        {isBasicBlockType(block.type) ? (
          <BasicBlockInspector block={block} onChange={onChange} />
        ) : null}
        {block.type === "HIGHLIGHT" ? (
          <>
            <Field label={t("linkTitle")} htmlFor="highlight-title">
              <Input id="highlight-title" value={String(config.title ?? "")} onChange={(event)=>patch({title:event.target.value})}/>
            </Field>
            <Field label={t("textContent")} htmlFor="highlight-text" optional={common("optional")}>
              <Textarea id="highlight-text" value={String(config.text ?? "")} onChange={(event)=>patch({text:event.target.value||undefined})}/>
            </Field>
            <Field label={t("tone")} htmlFor="highlight-tone">
              <select id="highlight-tone" value={String(config.tone ?? "accent")} onChange={(event)=>patch({tone:event.target.value})} className="h-9 rounded-sm border border-border bg-surface-raised px-3 text-sm">
                <option value="accent">{t("toneAccent")}</option><option value="success">{t("toneSuccess")}</option><option value="warning">{t("toneWarning")}</option><option value="neutral">{t("toneNeutral")}</option>
              </select>
            </Field>
            <Field label={t("linkUrl")} htmlFor="highlight-href" optional={common("optional")}>
              <Input id="highlight-href" inputMode="url" value={String(config.href ?? "")} onChange={(event)=>patch({href:event.target.value||undefined})}/>
            </Field>
          </>
        ) : null}
        {block.type === "COUNTDOWN" ? (
          <>
            <Field label={t("linkTitle")} htmlFor="countdown-title"><Input id="countdown-title" value={String(config.title ?? "")} onChange={(event)=>patch({title:event.target.value})}/></Field>
            <Field label={t("targetDate")} htmlFor="countdown-target"><Input id="countdown-target" type="datetime-local" value={String(config.targetAt ?? "").slice(0,16)} onChange={(event)=>event.target.value&&patch({targetAt:new Date(event.target.value).toISOString()})}/></Field>
            <Field label={t("expiredLabel")} htmlFor="countdown-expired"><Input id="countdown-expired" value={String(config.expiredLabel ?? "")} onChange={(event)=>patch({expiredLabel:event.target.value})}/></Field>
          </>
        ) : null}
        {block.type === "VISITOR_COUNTER" ? (
          <>
            <Field label={t("counterLabel")} htmlFor="counter-label"><Input id="counter-label" value={String(config.label ?? "")} onChange={(event)=>patch({label:event.target.value})}/></Field>
            <Field label={t("counterPeriod")} htmlFor="counter-period"><select id="counter-period" value={String(config.period ?? "total")} onChange={(event)=>patch({period:event.target.value})} className="h-9 rounded-sm border border-border bg-surface-raised px-3 text-sm"><option value="daily">{t("daily")}</option><option value="total">{t("total")}</option></select></Field>
          </>
        ) : null}
        {block.type === "SUPPORT" ? (
          <>
            <Field label={t("linkTitle")} htmlFor="support-title"><Input id="support-title" value={String(config.title ?? "")} onChange={(event)=>patch({title:event.target.value})}/></Field>
            <Field label={t("linkDescription")} htmlFor="support-description" optional={common("optional")}><Textarea id="support-description" value={String(config.description ?? "")} onChange={(event)=>patch({description:event.target.value||undefined})}/></Field>
            <Field label={t("supportProvider")} htmlFor="support-provider"><select id="support-provider" value={String(config.provider ?? "custom")} onChange={(event)=>patch({provider:event.target.value})} className="h-9 rounded-sm border border-border bg-surface-raised px-3 text-sm"><option value="coffee">Ko-fi</option><option value="buymeacoffee">Buy Me a Coffee</option><option value="papara">Papara</option><option value="iban">IBAN</option><option value="custom">{t("custom")}</option></select></Field>
            {config.provider === "iban" ? <Field label="IBAN" htmlFor="support-iban"><Input id="support-iban" value={String(config.iban ?? "")} onChange={(event)=>patch({iban:event.target.value})}/></Field> : <Field label={t("linkUrl")} htmlFor="support-href"><Input id="support-href" inputMode="url" value={String(config.href ?? "")} onChange={(event)=>patch({href:event.target.value})}/></Field>}
          </>
        ) : null}
        {block.type === "POLL" ? (
          <PollOptions
            question={String(config.question ?? "")}
            options={Array.isArray(config.options)?config.options as Array<{key:string;label:string}>:[]}
            onChange={(question,options)=>patch({question,options})}
          />
        ) : null}
        {block.type === "DISCORD" ? (
          <>
            <Field label={t("discordUserId")} htmlFor="discord-user-id" description={t("discordUserIdHelp")}><Input id="discord-user-id" inputMode="numeric" value={String(config.discordUserId ?? "")} onChange={(event)=>patch({discordUserId:event.target.value.replace(/\D/g,"")})}/></Field>
            <ToggleField label={t("showSpotify")} checked={Boolean(config.showSpotify)} onChange={(showSpotify)=>patch({showSpotify})}/>
            <ToggleField label={t("showActivity")} checked={Boolean(config.showActivity)} onChange={(showActivity)=>patch({showActivity})}/>
          </>
        ) : null}
        {block.type === "GITHUB" ? <><Field label={t("githubUsername")} htmlFor="github-username"><Input id="github-username" value={String(config.username ?? "")} onChange={(event)=>patch({username:event.target.value})}/></Field><ToggleField label={t("showContributions")} checked={Boolean(config.showContributions)} onChange={(showContributions)=>patch({showContributions})}/></> : null}
        {block.type === "SPOTIFY" ? <Field label={t("spotifyUrl")} htmlFor="spotify-url"><Input id="spotify-url" inputMode="url" value={String(config.resourceUrl ?? "")} onChange={(event)=>patch({resourceUrl:event.target.value})}/></Field> : null}
        {block.type === "YOUTUBE" ? <Field label={t("channelUrl")} htmlFor="youtube-url"><Input id="youtube-url" inputMode="url" value={String(config.channelUrl ?? "")} onChange={(event)=>patch({channelUrl:event.target.value})}/></Field> : null}
        {block.type === "TWITCH" ? <Field label={t("channelName")} htmlFor="twitch-channel"><Input id="twitch-channel" value={String(config.channel ?? "")} onChange={(event)=>patch({channel:event.target.value})}/></Field> : null}
      </div>
    </div>
  );
}

function ToggleField({label,checked,onChange}:{label:string;checked:boolean;onChange:(checked:boolean)=>void}) {
  return <label className="flex items-center justify-between gap-3 text-sm font-medium"><span>{label}</span><input type="checkbox" checked={checked} onChange={(event)=>onChange(event.target.checked)} className="size-4 accent-primary"/></label>;
}

function PollOptions({question,options,onChange}:{question:string;options:Array<{key:string;label:string}>;onChange:(question:string,options:Array<{key:string;label:string}>)=>void}) {
  const t=useTranslations("editor");
  const common=useTranslations("common");
  return <><Field label={t("pollQuestion")} htmlFor="poll-question"><Input id="poll-question" value={question} onChange={(event)=>onChange(event.target.value,options)}/></Field><div><div className="flex items-center justify-between"><p className="text-sm font-medium">{t("pollOptions")}</p><Button type="button" size="sm" variant="secondary" disabled={options.length>=6} onClick={()=>onChange(question,[...options,{key:`option-${Date.now().toString(36)}`,label:t("pollOption")}])}><Plus/>{t("addOption")}</Button></div><div className="mt-3 grid gap-2">{options.map((option,index)=><div key={option.key} className="flex gap-2"><Input aria-label={`${t("pollOption")} ${index+1}`} value={option.label} onChange={(event)=>onChange(question,options.map((item,itemIndex)=>itemIndex===index?{...item,label:event.target.value}:item))}/><IconButton label={common("delete")} disabled={options.length<=2} onClick={()=>onChange(question,options.filter((_,itemIndex)=>itemIndex!==index))}><Trash2/></IconButton></div>)}</div></div></>;
}
