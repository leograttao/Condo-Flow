import { initCrud } from "../crud.js";
import { prestadores } from "../config/telas/prestadores.js";

initCrud("prestadores", { config: prestadores });
