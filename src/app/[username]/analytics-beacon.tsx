"use client";import {useEffect} from "react";
function send(body:unknown){void fetch("/api/analytics",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body),keepalive:true});}
export function AnalyticsBeacon({profileId}:{profileId:string}){useEffect(()=>send({eventType:"PROFILE_VIEW",profileId}),[profileId]);return null;}
export function PublicLink({profileId,blockId,title,url}:{profileId:string;blockId:string;title:string;url:string}){return <a className="block border p-3" href={url} rel="noopener noreferrer" onClick={()=>send({eventType:"BLOCK_CLICK",profileId,blockId})}>{title}</a>}
