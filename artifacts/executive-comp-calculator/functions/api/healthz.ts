import { json } from "../_shared";

export const onRequestGet: PagesFunction = () => json({ status: "ok" });