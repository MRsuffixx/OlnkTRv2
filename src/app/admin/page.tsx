import {redirect} from "next/navigation";
import {auth} from "~/server/auth";
import {api} from "~/trpc/server";
import {hasRole} from "~/server/security/authorization";

function confirmed(form:FormData){return String(form.get("confirmation"))==="CONFIRM";}

export default async function Admin(){
  const session=await auth();
  if(!session||!hasRole(session.user.role,"ADMIN"))redirect("/dashboard");
  const [users,flags,reserved,catalog,jobs,audit]=await Promise.all([api.admin.users({query:""}),api.admin.flags(),api.admin.reservedUsernames(),api.admin.catalog(),api.admin.jobs(),api.admin.audit()]);
  async function suspend(form:FormData){"use server";if(!confirmed(form))return;await api.admin.setSuspended({userId:String(form.get("userId")),suspended:String(form.get("suspended"))==="true",confirmation:"CONFIRM"});}
  async function hide(form:FormData){"use server";if(!confirmed(form))return;await api.admin.setProfileHidden({profileId:String(form.get("profileId")),hidden:String(form.get("hidden"))==="true",confirmation:"CONFIRM"});}
  async function flag(form:FormData){"use server";await api.admin.setFlag({key:String(form.get("key")),enabled:String(form.get("enabled"))==="true"});}
  async function reserve(form:FormData){"use server";await api.admin.reserveUsername({username:String(form.get("username")),reason:String(form.get("reason"))});}
  async function release(form:FormData){"use server";if(!confirmed(form))return;await api.admin.releaseUsername({username:String(form.get("username")),confirmation:"CONFIRM"});}
  async function entitlement(form:FormData){"use server";if(!confirmed(form))return;const raw=String(form.get("limit"));await api.admin.setPlanEntitlement({planKey:String(form.get("planKey")),featureKey:String(form.get("featureKey")),enabled:String(form.get("enabled"))==="true",limit:raw===""?null:Number(raw),confirmation:"CONFIRM"});}
  return <main className="space-y-8 p-8">
    <h1 className="text-2xl font-bold">Admin</h1>
    <section><h2 className="font-bold">Users and profiles</h2>{users.map(user=><div className="my-2 border p-2" key={user.id}><span>{user.email} — {user.status} — {user.role}</span><form action={suspend} className="flex gap-2"><input type="hidden" name="userId" value={user.id}/><input type="hidden" name="suspended" value={String(user.status!=="SUSPENDED")}/><input name="confirmation" placeholder="Type CONFIRM" pattern="CONFIRM" required/><button className="border px-2">{user.status==="SUSPENDED"?"Unsuspend":"Suspend"}</button></form>{user.profiles.map(profile=><div key={profile.id}>{profile.username} ({profile.status}) <form action={hide} className="inline-flex gap-2"><input type="hidden" name="profileId" value={profile.id}/><input type="hidden" name="hidden" value={String(profile.status!=="HIDDEN")}/><input name="confirmation" placeholder="Type CONFIRM" pattern="CONFIRM" required/><button className="border px-2">{profile.status==="HIDDEN"?"Unhide":"Hide"}</button></form></div>)}</div>)}</section>
    <section><h2 className="font-bold">Feature flags</h2>{flags.map(item=><form action={flag} key={item.id}><input type="hidden" name="key" value={item.key}/><input type="hidden" name="enabled" value={String(!item.enabled)}/>{item.key}: {String(item.enabled)} <button className="border px-2">Toggle</button></form>)}</section>
    <section><h2 className="font-bold">Reserved usernames</h2><form action={reserve} className="flex gap-2"><input className="border" name="username" required/><input className="border" name="reason" required/><button className="border px-2">Reserve</button></form>{reserved.map(item=><form action={release} className="flex gap-2" key={item.username}><input type="hidden" name="username" value={item.username}/><span>{item.username}</span><input name="confirmation" placeholder="Type CONFIRM" pattern="CONFIRM" required/><button className="border px-2">Release</button></form>)}</section>
    <section><h2 className="font-bold">Plans and entitlements</h2>{catalog.map(plan=><details key={plan.id}><summary>{plan.name}</summary>{plan.entitlements.map(item=><form action={entitlement} className="flex gap-2" key={item.id}><input type="hidden" name="planKey" value={plan.key}/><input type="hidden" name="featureKey" value={item.feature.key}/><input type="hidden" name="enabled" value={String(!item.enabled)}/><span>{item.feature.key}: {String(item.enabled)}</span><input className="w-24 border" name="limit" type="number" min="0" defaultValue={item.limit??""}/><input name="confirmation" placeholder="Type CONFIRM" pattern="CONFIRM" required/><button className="border px-2">Toggle/update</button></form>)}</details>)}</section>
    <section><h2 className="font-bold">Unresolved job failures ({jobs.length})</h2><pre>{JSON.stringify(jobs,null,2)}</pre></section>
    <section><h2 className="font-bold">Audit</h2><pre>{JSON.stringify(audit,null,2)}</pre></section>
  </main>;
}
