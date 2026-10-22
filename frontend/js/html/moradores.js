import { initCrud } from "../crud.js";
import { moradores } from "../config/telas/moradores.js";

initCrud("moradores", { config: moradores });
