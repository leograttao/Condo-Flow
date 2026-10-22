import { initCrud } from "../crud.js";
import { comunicados } from "../config/telas/comunicados.js";

initCrud("comunicados", { config: comunicados });
