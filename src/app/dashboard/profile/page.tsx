import {revalidatePath} from "next/cache";
import {api} from "~/trpc/server";

export default async function ProfilePage(){
  const profiles=await api.profile.mine();
  async function update(form:FormData){"use server";await api.profile.update({profileId:String(form.get("profileId")),displayName:String(form.get("displayName")),bio:String(form.get("bio"))});revalidatePath("/dashboard/profile");}
  async function username(form:FormData){"use server";await api.profile.changeUsername({profileId:String(form.get("profileId")),username:String(form.get("username"))});revalidatePath("/dashboard/profile");}
  return <><h1 className="text-2xl font-bold">Profile</h1>{profiles.map(profile=><section key={profile.id} className="mt-4 space-y-3 border p-4"><form action={username} className="flex gap-2"><input type="hidden" name="profileId" value={profile.id}/><input className="border p-2" name="username" defaultValue={profile.username} required/><button className="border p-2">Change username</button></form><form action={update} className="grid max-w-lg gap-2"><input type="hidden" name="profileId" value={profile.id}/><input className="border p-2" name="displayName" defaultValue={profile.displayName} required/><textarea className="border p-2" name="bio" defaultValue={profile.bio??""}/><button className="border p-2">Save profile</button></form></section>)}</>;
}
