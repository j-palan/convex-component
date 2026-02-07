import { defineApp } from "convex/server";
import browserUse from "./components/browserUse/convex.config";

const app = defineApp();
app.use(browserUse);

export default app;
