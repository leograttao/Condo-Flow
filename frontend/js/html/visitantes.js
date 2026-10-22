import { initCrud } from "../crud.js";
import { visitantes } from "../config/telas/visitantes.js";

initCrud("visitantes", { config: visitantes });
